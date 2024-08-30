import os
import logging
import warnings

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
logging.getLogger("transformers").setLevel(logging.ERROR)

from transformers import pipeline
from PyPDF2 import PdfReader
from docx import Document
import re
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from transformers import logging as transformers_logging
transformers_logging.set_verbosity_error()

nlp = pipeline("ner", model="dbmdz/bert-large-cased-finetuned-conll03-english", tokenizer="dbmdz/bert-large-cased-finetuned-conll03-english")

def pdfxtract(file_path):
    reader = PdfReader(file_path)
    text = [page.extract_text() for page in reader.pages]
    return "\n".join(text)

def docxtract(file_path):
    doc = Document(file_path)
    text = [p.text for p in doc.paragraphs]
    return "\n".join(text)

def extract_text(file_path):
    ext = os.path.splitext(file_path)[1]
    if ext == '.pdf':
        return pdfxtract(file_path)
    elif ext == '.docx':
        return docxtract(file_path)
    else:
        return 'Unsupported file format'
    
def extractInfo(text):
    doc = nlp(text)
    
    names = []
    current_name = []
    
    for entity in doc:
        if entity['entity'] in ['B-PER', 'I-PER']:
            if entity['word'].startswith("##"):
                current_name.append(entity['word'][2:])
            else:
                if current_name:
                    names.append("".join(current_name))
                    current_name = []
                current_name.append(entity['word'])
        else:
            if current_name:
                names.append("".join(current_name))
                current_name = []
    
    if current_name:
        names.append("".join(current_name))

    phones = re.findall(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)

    addresses = re.findall(r'\d{1,5} \w+ (Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Lane|Ln|Block|Sector)\b', text)

    return {
        'names': names,
        'phones': phones,
        'addresses': addresses
    }

def redact(text, info):
    for name in info['names']:
        text = text.replace(name, '[REDACTED]')
    for phone in info['phones']:
        text = text.replace(phone, '[REDACTED]')
    for address in info['addresses']:
        text = text.replace(address, '[REDACTED]')
    return text

def redactedDocx(text, output_path):
    doc = Document()
    for line in text.split('\n'):
        doc.add_paragraph(line)
    doc.save(output_path)

def redactedPdf(text, output_path):
    c = canvas.Canvas(output_path, pagesize=letter)
    text_object = c.beginText(40, 750)  # Starting position

    lines = text.split('\n')
    for line in lines:
        text_object.textLine(line)
    c.drawText(text_object)
    c.save()

if __name__ == '__main__':
    file_path = input('Enter the file path: ')
    try:
        text = extract_text(file_path)
        info = extractInfo(text)
        redacted = redact(text, info)
        output = input("Enter the output file path: ")
        if output.endswith('.docx'):
            redactedDocx(redacted, output)
        elif output.endswith('.pdf'):
            redactedPdf(redacted, output)
        else:
            print("Unsupported output format")

        print(f"Redacted file saved as: {output}")
    except Exception as e:
        print("Error:", e)



