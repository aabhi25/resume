#!/usr/bin/env python3
import sys
import json
import os
import re
import requests
from typing import Dict, List, Any

class ResumeGenerator:
    def __init__(self):
        self.api_key = None
        self.api_base_url = None
        self.ai_mode = False
        
        # Check for LLaMA API configuration (Groq, Together AI, etc.)
        self.api_key = os.getenv('LLAMA_API_KEY')
        self.api_base_url = os.getenv('LLAMA_API_URL', 'https://api.groq.com/openai/v1/chat/completions')
        self.model_name = os.getenv('LLAMA_MODEL', 'llama3-8b-8192')
        
        if self.api_key:
            self.ai_mode = True
            print(f"AI mode enabled with hosted LLaMA model: {self.model_name}", file=sys.stderr)
        else:
            print("No LLAMA_API_KEY found, using rule-based fallback mode", file=sys.stderr)
            self.ai_mode = False
    
    def calculate_match_score(self, job_description: str, resume: str) -> int:
        """Calculate how well the resume matches the job description"""
        
        # Extract keywords from job description
        jd_keywords = self.extract_keywords(job_description.lower())
        resume_keywords = self.extract_keywords(resume.lower())
        
        # Calculate overlap
        if not jd_keywords:
            return 50  # Default score if no keywords found
        
        matches = len(set(jd_keywords) & set(resume_keywords))
        score = min(int((matches / len(jd_keywords)) * 100), 100)
        
        return max(score, 25)  # Minimum 25% match
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text"""
        
        # Common technical skills and keywords
        tech_patterns = [
            r'\b(python|java|javascript|react|angular|vue|node\.?js|express)\b',
            r'\b(sql|mysql|postgresql|mongodb|redis|elasticsearch)\b',
            r'\b(aws|azure|gcp|docker|kubernetes|terraform)\b',
            r'\b(git|github|gitlab|jenkins|ci/cd)\b',
            r'\b(html|css|scss|tailwind|bootstrap)\b',
            r'\b(typescript|php|ruby|c\+\+|c#|swift|kotlin)\b',
            r'\b(api|rest|graphql|microservices|agile|scrum)\b'
        ]
        
        keywords = []
        for pattern in tech_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            keywords.extend(matches)
        
        # Also extract multi-word technical terms
        multi_word_patterns = [
            r'machine learning', r'data science', r'full stack', r'front end', r'back end',
            r'software engineer', r'web developer', r'data analyst', r'project manager'
        ]
        
        for pattern in multi_word_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                keywords.append(pattern.replace(' ', '_'))
        
        return list(set(keywords))
    
    def enhance_content(self, job_description: str, original_resume: str, parsed_data: Dict) -> str:
        """Generate enhanced resume content using AI"""
        
        if not self.ai_mode:
            # Fallback to rule-based enhancement
            return self.rule_based_enhancement(job_description, parsed_data)
        
        try:
            return self.ai_enhancement(job_description, original_resume, parsed_data)
        except Exception as e:
            print(f"AI enhancement failed, using rule-based: {e}", file=sys.stderr)
            return self.rule_based_enhancement(job_description, parsed_data)
    
    def ai_enhancement(self, job_description: str, original_resume: str, parsed_data: Dict) -> str:
        """Use hosted LLaMA API to enhance resume content"""
        
        system_prompt = "You are an expert resume writer. Help optimize resumes to match job requirements while maintaining accuracy and truthfulness."
        
        user_prompt = f"""Job Description:
{job_description[:800]}

Current Resume Summary:
{parsed_data.get('summary', 'No summary provided')[:400]}

Current Skills:
{', '.join(parsed_data.get('skills', [])[:10])}

Please enhance this resume by:
1. Improving the summary to better align with the job requirements
2. Suggesting additional relevant skills that match the job description
3. Maintaining truthfulness - don't add fake experience

Respond ONLY with valid JSON in this exact format:
{{
    "enhanced_summary": "improved summary text here",
    "suggested_skills": ["skill1", "skill2", "skill3"],
    "improvements": "explanation of changes made"
}}"""

        # Prepare API request
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': self.model_name,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            'temperature': 0.7,
            'max_tokens': 500
        }
        
        try:
            response = requests.post(
                self.api_base_url,
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result['choices'][0]['message']['content']
                
                # Try to extract JSON from response
                json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if json_match:
                    ai_suggestions = json.loads(json_match.group())
                    
                    # Apply enhancements
                    enhanced_data = parsed_data.copy()
                    enhanced_data['summary'] = ai_suggestions.get('enhanced_summary', parsed_data.get('summary', ''))
                    
                    # Add suggested skills if they're not already present
                    current_skills = set(enhanced_data.get('skills', []))
                    suggested_skills = ai_suggestions.get('suggested_skills', [])
                    for skill in suggested_skills:
                        if skill.strip() and skill.strip() not in current_skills and len(current_skills) < 20:
                            current_skills.add(skill.strip())
                    
                    enhanced_data['skills'] = list(current_skills)
                    enhanced_data['ai_improvements'] = ai_suggestions.get('improvements', '')
                    
                    return json.dumps(enhanced_data, indent=2)
                else:
                    # Fallback if JSON parsing fails
                    enhanced_data = parsed_data.copy()
                    enhanced_data['summary'] = ai_response[:300] if ai_response else parsed_data.get('summary', '')
                    return json.dumps(enhanced_data, indent=2)
            else:
                print(f"API request failed with status {response.status_code}: {response.text}", file=sys.stderr)
                return self.rule_based_enhancement(job_description, parsed_data)
                
        except (requests.RequestException, json.JSONDecodeError, Exception) as e:
            print(f"API request failed: {e}, using rule-based fallback", file=sys.stderr)
            return self.rule_based_enhancement(job_description, parsed_data)
    
    def rule_based_enhancement(self, job_description: str, parsed_data: Dict) -> str:
        """Rule-based content enhancement as fallback"""
        
        jd_keywords = self.extract_keywords(job_description.lower())
        
        enhanced_data = parsed_data.copy()
        
        # Enhance summary
        if enhanced_data.get('summary'):
            summary = enhanced_data['summary']
            
            # Add relevant keywords if missing
            for keyword in jd_keywords[:3]:  # Top 3 keywords
                if keyword.lower() not in summary.lower():
                    summary += f" Experienced with {keyword.replace('_', ' ')}."
            
            enhanced_data['summary'] = summary
        
        # Enhance skills
        current_skills = enhanced_data.get('skills', [])
        for keyword in jd_keywords:
            formatted_keyword = keyword.replace('_', ' ').title()
            if formatted_keyword not in current_skills and len(current_skills) < 15:
                current_skills.append(formatted_keyword)
        
        enhanced_data['skills'] = current_skills
        
        # Add quantified achievements to work experience
        if enhanced_data.get('workExperience'):
            for exp in enhanced_data['workExperience']:
                if exp.get('responsibilities'):
                    enhanced_responsibilities = []
                    for resp in exp['responsibilities']:
                        # Add metrics if missing
                        if not re.search(r'\d+%|\d+\+|increased|improved|reduced', resp.lower()):
                            enhanced_resp = resp + " (improved efficiency by 20%)"
                        else:
                            enhanced_resp = resp
                        enhanced_responsibilities.append(enhanced_resp)
                    exp['responsibilities'] = enhanced_responsibilities
        
        return json.dumps(enhanced_data, indent=2)

def main():
    if len(sys.argv) < 2:
        print("Usage: python resume-generator.py <mode>", file=sys.stderr)
        sys.exit(1)
    
    mode = sys.argv[1]
    generator = ResumeGenerator()
    
    try:
        if mode == 'match':
            # Calculate match score
            input_data = json.loads(sys.stdin.read())
            score = generator.calculate_match_score(
                input_data['jobDescription'],
                input_data['resume']
            )
            print(score)
            
        elif mode == 'enhance':
            # Generate enhanced content
            input_data = json.loads(sys.stdin.read())
            enhanced_content = generator.enhance_content(
                input_data['jobDescription'],
                input_data['originalResume'],
                input_data['parsedData']
            )
            print(enhanced_content)
            
        else:
            print(f"Unknown mode: {mode}", file=sys.stderr)
            sys.exit(1)
            
    except Exception as e:
        print(f"Error in resume generation: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
