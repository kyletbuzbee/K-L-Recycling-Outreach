from docx import Document
import csv
import re

# Open the .docx file
doc = Document('Untitled document.docx')

# Get all paragraphs
paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

print(f'Total paragraphs: {len(paragraphs)}')

# Parse the columnar data
# The document appears to have columns of data
# Strategy: identify each type of data and match by position

tickets = []
dates_suppliers = []
materials_info = []  # (material, weight, price)

i = 0
skip_words = ['logo', 'Transactional Detail by Facility', 'Ticket #', 'Date', 'Supplier', 'Group', 'Material', 'Net', 'Price']

while i < len(paragraphs):
    para = paragraphs[i]
    
    # Skip headers
    if para in skip_words or 'From' in para and 'to' in para:
        i += 1
        continue
    
    # Ticket numbers (4-5 digit numbers)
    if para.isdigit() and len(para) >= 4:
        tickets.append(para)
        i += 1
        continue
    
    # Date and supplier pattern: MM/DD/YYYY [Supplier]
    date_match = re.match(r'(\d{2}/\d{2}/\d{4})\s+\[(.+?)\]', para)
    if date_match:
        dates_suppliers.append((date_match.group(1), date_match.group(2)))
        i += 1
        continue
    
    # Material patterns
    if any(kw in para for kw in ['Ferrous', 'Non-Ferrous', 'Non Ferrous', 'Aluminum', 'Copper', 'Brass', 'Steel', 'Stainless']):
        # Check if weight is on the same line or next line
        parts = para.rsplit(None, 1)
        
        if len(parts) == 2 and parts[1].replace(',', '').isdigit():
            # Weight is on the same line
            material = parts[0]
            weight = parts[1]
            i += 1
            # Price should be on the next line
            price = ''
            if i < len(paragraphs):
                try:
                    float(paragraphs[i].replace(',', ''))
                    price = paragraphs[i]
                    i += 1
                except ValueError:
                    pass
            materials_info.append((material, weight, price))
        else:
            # Material only, weight should be on next line
            material = para
            i += 1
            weight = ''
            price = ''
            
            # Check next line for weight
            if i < len(paragraphs) and paragraphs[i].replace(',', '').isdigit():
                weight = paragraphs[i]
                i += 1
                
                # Check next line for price
                if i < len(paragraphs):
                    try:
                        float(paragraphs[i].replace(',', ''))
                        price = paragraphs[i]
                        i += 1
                    except ValueError:
                        pass
            
            materials_info.append((material, weight, price))
        continue
    
    i += 1

print(f'Found: {len(tickets)} tickets, {len(dates_suppliers)} dates/suppliers, {len(materials_info)} material entries')

# Match them up - align by position
csv_data = []
max_len = max(len(tickets), len(dates_suppliers), len(materials_info))

for idx in range(max_len):
    row = {}
    if idx < len(tickets):
        row['Ticket #'] = tickets[idx]
    if idx < len(dates_suppliers):
        row['Date'] = dates_suppliers[idx][0]
        row['Supplier'] = dates_suppliers[idx][1]
    if idx < len(materials_info):
        row['Material'] = materials_info[idx][0]
        row['Net Weight'] = materials_info[idx][1]
        row['Price'] = materials_info[idx][2]
    
    # Only add rows that have at least a ticket number or material
    if row.get('Ticket #') or row.get('Material'):
        csv_data.append(row)

# Write to CSV
output_file = 'converted_transactions.csv'
if csv_data:
    fieldnames = ['Ticket #', 'Date', 'Supplier', 'Material', 'Net Weight', 'Price']
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in csv_data:
            writer.writerow(row)
    
    print(f'Successfully converted {len(csv_data)} transactions to CSV')
    print(f'Output file: {output_file}')
else:
    print('No data extracted')
