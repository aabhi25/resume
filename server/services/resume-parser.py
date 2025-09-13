#!/usr/bin/env python3
import sys
import json
import re
import os
import requests
from typing import Dict, List, Any, Optional

def parse_resume(text: str) -> Dict[str, Any]:
    """Parse resume text into structured data using AI or fallback to rule-based parsing"""
    
    # Try AI-powered parsing first if available
    ai_parsed = ai_parse_resume(text)
    if ai_parsed:
        return ai_parsed
    
    # Fallback to rule-based parsing
    return rule_based_parse_resume(text)

def ai_parse_resume(text: str) -> Optional[Dict[str, Any]]:
    """Use LLaMA API to intelligently parse resume"""
    
    api_key = os.getenv('LLAMA_API_KEY')
    if not api_key:
        return None
    
    api_url = os.getenv('LLAMA_API_URL', 'https://api.groq.com/openai/v1/chat/completions')
    model_name = os.getenv('LLAMA_MODEL', 'llama-3.1-8b-instant')
    
    system_prompt = "You are an expert resume parser. Extract structured information from resumes accurately."
    
    user_prompt = f"""Parse this resume text and extract the information into the following JSON structure. Be as accurate as possible and don't make up information that isn't present:

Resume Text:
{text[:2000]}

Respond ONLY with valid JSON in this exact format:
{{
    "summary": "professional summary or objective",
    "workExperience": [
        {{
            "position": "job title",
            "company": "company name",
            "duration": "start date - end date",
            "responsibilities": ["responsibility 1", "responsibility 2"]
        }}
    ],
    "education": [
        {{
            "degree": "degree name",
            "institution": "school name",
            "year": "graduation year"
        }}
    ],
    "skills": ["skill1", "skill2", "skill3"],
    "projects": [
        {{
            "name": "project name",
            "description": "project description",
            "technologies": ["tech1", "tech2"]
        }}
    ]
}}"""
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'model': model_name,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ],
        'temperature': 0.3,
        'max_tokens': 800
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result['choices'][0]['message']['content']
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                parsed_data = json.loads(json_match.group())
                return parsed_data
        else:
            print(f"AI parsing failed with status {response.status_code}", file=sys.stderr)
            
    except (requests.RequestException, json.JSONDecodeError, Exception) as e:
        print(f"AI parsing failed: {e}", file=sys.stderr)
    
    return None

def rule_based_parse_resume(text: str) -> Dict[str, Any]:
    """Rule-based resume parsing as fallback"""
    
    # Initialize sections
    sections = {
        "summary": "",
        "workExperience": [],
        "education": [],
        "skills": [],
        "projects": []
    }
    
    # Split text into lines and normalize
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    current_section = None
    current_content = []
    
    # Common section headers
    section_patterns = {
        'summary': r'(summary|profile|objective|about)',
        'experience': r'(experience|employment|work|career)',
        'education': r'(education|academic|qualifications)',
        'skills': r'(skills|technical|competencies|technologies)',
        'projects': r'(projects|portfolio|work samples)'
    }
    
    for line in lines:
        line_lower = line.lower()
        
        # Check if this line is a section header
        section_found = None
        for section, pattern in section_patterns.items():
            if re.search(pattern, line_lower) and len(line.split()) <= 3:
                section_found = section
                break
        
        if section_found:
            # Process previous section
            if current_section and current_content:
                process_section(sections, current_section, current_content)
            
            current_section = section_found
            current_content = []
        else:
            if current_section:
                current_content.append(line)
    
    # Process final section
    if current_section and current_content:
        process_section(sections, current_section, current_content)
    
    # If no sections were found, try to extract content differently
    if not any(sections.values()):
        sections = parse_unstructured_resume(text)
    
    return sections

def process_section(sections: Dict, section_type: str, content: List[str]):
    """Process content for a specific section"""
    
    if section_type == 'summary':
        sections['summary'] = ' '.join(content)
    
    elif section_type == 'experience':
        sections['workExperience'] = parse_work_experience(content)
    
    elif section_type == 'education':
        sections['education'] = parse_education(content)
    
    elif section_type == 'skills':
        sections['skills'] = parse_skills(content)
    
    elif section_type == 'projects':
        sections['projects'] = parse_projects(content)

def parse_work_experience(content: List[str]) -> List[Dict]:
    """Parse work experience section"""
    experiences = []
    current_exp = {}
    
    for line in content:
        # Check for bullet points first to avoid treating them as new entries
        if line.startswith('•') or line.startswith('-') or line.startswith('*'):
            if current_exp:
                current_exp['responsibilities'].append(line[1:].strip())
            continue
        
        # Look for job header patterns using improved regex
        header_match = re.match(r'^(?P<role>.+?)\s*[|•–—]\s*(?P<company>.+?)(?:\s*[|•–—]\s*(?P<dates>.*))?$', line)
        
        if header_match:
            # Save previous experience if exists
            if current_exp:
                experiences.append(current_exp)
            
            # Create new experience with correct field assignment
            current_exp = {
                'position': header_match.group('role').strip(),
                'company': header_match.group('company').strip(),
                'duration': header_match.group('dates').strip() if header_match.group('dates') else '',
                'responsibilities': []
            }
        elif current_exp and not current_exp.get('duration') and re.search(r'\d{4}', line):
            # Handle duration on separate line
            current_exp['duration'] = line.strip()
    
    if current_exp:
        experiences.append(current_exp)
    
    return experiences

def parse_education(content: List[str]) -> List[Dict]:
    """Parse education section"""
    education = []
    
    for line in content:
        # Skip bullet points and coursework lines
        if (line.startswith('•') or line.startswith('-') or line.startswith('*') or 
            'relevant coursework' in line.lower() or 'coursework' in line.lower()):
            continue
        
        # Use word-boundary degree patterns
        degree_match = re.search(r'\b(?:bachelor|master|phd|doctorate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|associate)\b', line.lower())
        year_match = re.search(r'\b(\d{4})\b', line)
        
        if degree_match or year_match:
            # Parse pipe-separated format first, then fallback to comma/dash
            if '|' in line:
                parts = [part.strip() for part in line.split('|')]
                education.append({
                    'degree': parts[0] if len(parts) > 0 else (degree_match.group() if degree_match else ''),
                    'institution': parts[1] if len(parts) > 1 else '',
                    'year': parts[2] if len(parts) > 2 else (year_match.group() if year_match else '')
                })
            else:
                education.append({
                    'institution': line.split(',')[0] if ',' in line else line.split('-')[0].strip(),
                    'degree': degree_match.group() if degree_match else '',
                    'year': year_match.group() if year_match else ''
                })
    
    return education

def parse_skills(content: List[str]) -> List[str]:
    """Parse skills section"""
    skills = set()  # Use set for automatic deduplication
    
    for line in content:
        # Remove category labels by splitting on colon first
        if ':' in line:
            line = line.split(':', 1)[1]  # Take everything after the first colon
        
        # Split by common delimiters but preserve hyphens in skill names
        line_skills = re.split(r'[,;•\|]', line)
        for skill in line_skills:
            skill = skill.strip()
            # Filter out short or invalid skills
            if skill and len(skill) > 1 and not skill.isdigit():
                # Normalize case but preserve original capitalization patterns
                skills.add(skill)
    
    # Convert back to list and sort for consistency
    return sorted(list(skills))

def parse_projects(content: List[str]) -> List[Dict]:
    """Parse projects section"""
    projects = []
    current_project = {}
    
    for line in content:
        # Handle bullet points
        if line.startswith('•') or line.startswith('-') or line.startswith('*'):
            if current_project:
                bullet_content = line[1:].strip()
                if bullet_content.startswith('Technologies:') or bullet_content.startswith('Tech:'):
                    tech_list = bullet_content.split(':', 1)[1] if ':' in bullet_content else bullet_content
                    current_project['technologies'] = [t.strip() for t in tech_list.split(',')]
                elif 'Technologies:' in bullet_content:
                    # Handle inline technologies within bullet description
                    parts = bullet_content.split('Technologies:', 1)
                    if len(parts) == 2:
                        current_project['description'] += ' ' + parts[0].strip()
                        current_project['technologies'] = [t.strip() for t in parts[1].split(',')]
                    else:
                        current_project['description'] += ' ' + bullet_content
                else:
                    current_project['description'] += ' ' + bullet_content
            continue
        
        # Recognize project headers with year and pipe patterns
        header_match = re.match(r'^(?P<name>.+?)\s*[|•–—]\s*(?P<year>\d{4}).*$', line)
        
        if header_match:
            # Save previous project if exists
            if current_project:
                projects.append(current_project)
            
            current_project = {
                'name': header_match.group('name').strip(),
                'year': header_match.group('year'),
                'description': '',
                'technologies': []
            }
        elif line.isupper() or (len(line.split()) <= 4 and ':' not in line and '|' not in line):
            # Fallback for simple project names
            if current_project:
                projects.append(current_project)
            
            current_project = {
                'name': line,
                'description': '',
                'technologies': []
            }
        elif current_project:
            if line.startswith('Technologies:') or line.startswith('Tech:'):
                tech_list = line.split(':', 1)[1] if ':' in line else line
                current_project['technologies'] = [t.strip() for t in tech_list.split(',')]
            elif 'Technologies:' in line:
                # Handle inline technologies in description
                parts = line.split('Technologies:', 1)
                if len(parts) == 2:
                    current_project['description'] += ' ' + parts[0].strip()
                    current_project['technologies'] = [t.strip() for t in parts[1].split(',')]
                else:
                    current_project['description'] += ' ' + line
            else:
                current_project['description'] += ' ' + line
    
    if current_project:
        projects.append(current_project)
    
    return projects

def parse_unstructured_resume(text: str) -> Dict[str, Any]:
    """Enhanced fallback parser for unstructured resumes"""
    
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Parse work experience from the resume
    work_experience = []
    education = []
    skills = []
    
    # Look for work experience patterns
    for i, line in enumerate(lines):
        # Match job titles with companies and dates
        job_match = re.search(r'(Product Manager|Senior Product Analyst|Digital Marketing Intern)', line, re.IGNORECASE)
        if job_match:
            position = job_match.group(1)
            
            # Look for company and duration info nearby
            company = ""
            duration = ""
            
            # Check current and next few lines for company/dates
            for j in range(i, min(i+3, len(lines))):
                company_match = re.search(r'([A-Z][A-Za-z\s]+(?:Ltd|Pvt|Inc|Corp)\.?)', lines[j])
                date_match = re.search(r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}.*?\d{4})', lines[j])
                
                if company_match and not company:
                    company = company_match.group(1).strip()
                if date_match and not duration:
                    duration = date_match.group(1).strip()
            
            # Get responsibilities from surrounding lines
            responsibilities = []
            for k in range(i+1, min(i+5, len(lines))):
                if lines[k].startswith(('•', '-', '*')) or 'built' in lines[k].lower() or 'led' in lines[k].lower():
                    responsibilities.append(lines[k].strip('•-* '))
            
            work_experience.append({
                "position": position,
                "company": company or "Company Not Found",
                "duration": duration or "Duration Not Found", 
                "responsibilities": responsibilities[:3]  # Limit to 3 responsibilities
            })
    
    # Look for education
    for line in lines:
        if re.search(r'(B\.?Tech|MBA|Bachelor|Master)', line, re.IGNORECASE):
            degree_match = re.search(r'(B\.?Tech[^,]*|MBA[^,]*)', line, re.IGNORECASE)
            year_match = re.search(r'(\d{4})', line)
            
            education.append({
                "degree": degree_match.group(1) if degree_match else line[:50],
                "institution": "Institution details in resume",
                "year": year_match.group(1) if year_match else "Year not specified"
            })
    
    # Extract skills from the resume text
    skill_keywords = [
        'Product Management', 'Fintech', 'API', 'Agile', 'Scrum', 'KYC', 'AML', 
        'UPI', 'Compliance', 'Leadership', 'Python', 'JavaScript', 'SQL', 
        'n8n', 'LLM', 'AI', 'Machine Learning', 'Analytics', 'Jira', 'Figma'
    ]
    
    text_lower = text.lower()
    for skill in skill_keywords:
        if skill.lower() in text_lower:
            skills.append(skill)
    
    # Get a better summary
    summary_start = text.find("Summary")
    if summary_start > -1:
        summary_text = text[summary_start:summary_start+300]
    else:
        # Use the first part that looks like a summary
        summary_text = text[:300]
    
    return {
        "summary": summary_text.replace("Summary", "").strip(),
        "workExperience": work_experience,
        "education": education,
        "skills": list(set(skills)),  # Remove duplicates
        "projects": []
    }

def main():
    try:
        # Read from stdin
        text = sys.stdin.read()
        
        if not text.strip():
            raise Exception("No input text provided")
        
        # Parse the resume
        parsed_data = parse_resume(text)
        
        # Output as JSON
        print(json.dumps(parsed_data, indent=2))
        
    except Exception as e:
        print(f"Error parsing resume: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
