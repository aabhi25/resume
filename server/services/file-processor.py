#!/usr/bin/env python3
import sys
import os
import PyPDF2
import docx
from pathlib import Path

def extract_text_from_pdf(file_path):
    """Extract text from PDF file using PyPDF2"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_path):
    """Extract text from DOCX file using python-docx"""
    try:
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Error reading DOCX: {str(e)}")

def extract_text_from_txt(file_path):
    """Extract text from TXT file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    except Exception as e:
        try:
            # Try with different encoding
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read().strip()
        except Exception as e2:
            raise Exception(f"Error reading TXT: {str(e2)}")

def main():
    if len(sys.argv) != 3:
        print("Usage: python file-processor.py <file_path> <mime_type>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    mime_type = sys.argv[2]
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}", file=sys.stderr)
        sys.exit(1)
    
    try:
        if mime_type == 'application/pdf' or file_path.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_path)
        elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or file_path.lower().endswith('.docx'):
            text = extract_text_from_docx(file_path)
        elif mime_type == 'text/plain' or file_path.lower().endswith('.txt'):
            text = extract_text_from_txt(file_path)
        else:
            # Try to guess based on file extension
            ext = Path(file_path).suffix.lower()
            if ext == '.pdf':
                text = extract_text_from_pdf(file_path)
            elif ext == '.docx':
                text = extract_text_from_docx(file_path)
            elif ext == '.txt':
                text = extract_text_from_txt(file_path)
            else:
                raise Exception(f"Unsupported file type: {mime_type}")
        
        print(text)
        
    except Exception as e:
        print(f"Error processing file: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
