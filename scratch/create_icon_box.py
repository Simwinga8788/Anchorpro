import os
from PIL import Image, ImageDraw

def create_pwa_icons_box():
    logo_path = r"c:\Users\simwi\Desktop\Anchor Pro\AnchorPro\anchor-pro-web\public\AnchorPro_logo.png"
    output_dir = r"c:\Users\simwi\Desktop\Anchor Pro\AnchorPro\anchor-pro-web\public"
    
    if not os.path.exists(logo_path):
        print(f"Error: Logo not found at {logo_path}")
        return

    # Load original logo
    logo = Image.open(logo_path).convert("RGBA")
    
    # Crop to get ONLY the symbol (y: 77 to 349, x: 60 to 445)
    symbol = logo.crop((60, 77, 445, 349))
    sym_w, sym_h = symbol.size
    print(f"Cropped symbol size: {sym_w}x{sym_h}")

    # Generate 512x512 icon
    size_512 = 512
    icon_512 = Image.new("RGBA", (size_512, size_512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon_512)
    
    # Draw a white rounded rectangle to fill the space
    padding = 6
    radius = 90
    draw.rounded_rectangle(
        [(padding, padding), (size_512 - padding, size_512 - padding)],
        radius=radius,
        fill=(255, 255, 255, 255)
    )
    
    # Make the symbol fill almost the entire width (440px out of 512px)
    target_w = 440
    target_h = int(sym_h * (target_w / sym_w))
    
    resized_sym = symbol.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Center the symbol inside 512x512
    offset_x = (size_512 - target_w) // 2
    offset_y = (size_512 - target_h) // 2
    
    icon_512.paste(resized_sym, (offset_x, offset_y), resized_sym)
    
    # Save 512x512 icon
    icon_512.save(os.path.join(output_dir, "AnchorPro_pwa_icon_512.png"), "PNG")
    print("Saved AnchorPro_pwa_icon_512.png")
    
    # Generate 192x192 icon
    size_192 = 192
    icon_192 = Image.new("RGBA", (size_192, size_192), (0, 0, 0, 0))
    draw_192 = ImageDraw.Draw(icon_192)
    
    # Draw white rounded rectangle for 192
    padding_192 = 2
    radius_192 = 34
    draw_192.rounded_rectangle(
        [(padding_192, padding_192), (size_192 - padding_192, size_192 - padding_192)],
        radius=radius_192,
        fill=(255, 255, 255, 255)
    )
    
    # Resize symbol for 192
    target_w_192 = 165
    target_h_192 = int(sym_h * (target_w_192 / sym_w))
    
    resized_sym_192 = symbol.resize((target_w_192, target_h_192), Image.Resampling.LANCZOS)
    
    # Center the symbol inside 192x192
    offset_x_192 = (size_192 - target_w_192) // 2
    offset_y_192 = (size_192 - target_h_192) // 2
    
    icon_192.paste(resized_sym_192, (offset_x_192, offset_y_192), resized_sym_192)
    
    # Save 192x192 icon
    icon_192.save(os.path.join(output_dir, "AnchorPro_pwa_icon_192.png"), "PNG")
    print("Saved AnchorPro_pwa_icon_192.png")

if __name__ == "__main__":
    create_pwa_icons_box()
