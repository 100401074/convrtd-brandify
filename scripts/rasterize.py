"""Rasterize every PDF in samples/outputs to PNG pages in samples/shots/.
Usage: python scripts/rasterize.py [dpi]  (default dpi=120)
"""
import sys, os, glob
import fitz  # PyMuPDF

DPI = int(sys.argv[1]) if len(sys.argv) > 1 else 120
root = os.getcwd()
out_dir = os.path.join(root, "samples", "shots")
os.makedirs(out_dir, exist_ok=True)

pdfs = sorted(glob.glob(os.path.join(root, "samples", "outputs", "*.pdf")))
if not pdfs:
    print("No PDFs in samples/outputs. Run the batch first.")
    sys.exit(1)

for pdf_path in pdfs:
    name = os.path.splitext(os.path.basename(pdf_path))[0]
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=DPI)
        png = os.path.join(out_dir, f"{name}__p{i+1:02d}.png")
        pix.save(png)
    print(f"{name}: {doc.page_count} pages")
    doc.close()
print("done ->", out_dir)
