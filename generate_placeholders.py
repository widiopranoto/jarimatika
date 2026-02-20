from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder(text, filename, bg_color):
    img = Image.new('RGB', (200, 250), color=bg_color)
    d = ImageDraw.Draw(img)

    # Simple centered text logic without external font dependency
    # Drawing a big cross and the number in top left for simple identification
    d.text((20, 20), text, fill=(255,255,255))
    d.rectangle([50, 50, 150, 200], outline="white", width=5)

    img.save(filename)

def main():
    os.makedirs("images/left", exist_ok=True)
    os.makedirs("images/right", exist_ok=True)

    # Left Hand (Tens) - Blueish
    for i in range(10):
        create_placeholder(f"Left: {i*10}", f"images/left/{i}.png", "#3498db")
        print(f"Created images/left/{i}.png")

    # Right Hand (Units) - Greenish
    for i in range(10):
        create_placeholder(f"Right: {i}", f"images/right/{i}.png", "#2ecc71")
        print(f"Created images/right/{i}.png")

if __name__ == "__main__":
    main()
