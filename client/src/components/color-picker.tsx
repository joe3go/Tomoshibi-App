
import React, { useState, useEffect } from 'react';

interface ColorPickerProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ isVisible, onToggle }) => {
  const [colors, setColors] = useState({
    background: '#f0e9e4', // hsl(35, 25%, 92%) converted to hex
    header: '#855a5a',     // hsl(354, 33%, 36%) converted to hex
    card: '#3d3f47'        // hsl(221, 21%, 24%) converted to hex
  });

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const updateCSSVariable = (property: string, value: string) => {
    const hslValue = hexToHsl(value);
    document.documentElement.style.setProperty(`--${property}`, hslValue);
  };

  const handleColorChange = (colorType: keyof typeof colors, value: string) => {
    setColors(prev => ({ ...prev, [colorType]: value }));
    
    switch (colorType) {
      case 'background':
        document.body.style.background = value;
        updateCSSVariable('background', value);
        break;
      case 'header':
        const navbars = document.querySelectorAll('.navbar, .bottom-nav');
        navbars.forEach(navbar => {
          (navbar as HTMLElement).style.background = value;
        });
        break;
      case 'card':
        const cards = document.querySelectorAll('.content-card, .color-picker-panel');
        cards.forEach(card => {
          (card as HTMLElement).style.background = value;
        });
        updateCSSVariable('card', value);
        break;
    }
  };

  useEffect(() => {
    // Initialize colors on mount
    Object.entries(colors).forEach(([key, value]) => {
      handleColorChange(key as keyof typeof colors, value);
    });
  }, []);

  if (!isVisible) {
    return (
      <button 
        onClick={onToggle}
        className="color-toggle-btn"
      >
        🎨 Colors
      </button>
    );
  }

  return (
    <>
      <button 
        onClick={onToggle}
        className="color-toggle-btn"
      >
        ✕ Close
      </button>
      
      <div className="color-picker-panel">
        <h3 className="text-lg font-semibold mb-4 text-white">Customize Colors</h3>
        
        <div className="color-input-group">
          <label htmlFor="background-color">Background Color</label>
          <input
            id="background-color"
            type="color"
            value={colors.background}
            onChange={(e) => handleColorChange('background', e.target.value)}
            className="color-input"
          />
        </div>

        <div className="color-input-group">
          <label htmlFor="header-color">Header/Navigation Color</label>
          <input
            id="header-color"
            type="color"
            value={colors.header}
            onChange={(e) => handleColorChange('header', e.target.value)}
            className="color-input"
          />
        </div>

        <div className="color-input-group">
          <label htmlFor="card-color">Card Color</label>
          <input
            id="card-color"
            type="color"
            value={colors.card}
            onChange={(e) => handleColorChange('card', e.target.value)}
            className="color-input"
          />
        </div>

        <div className="mt-4 text-xs text-gray-300">
          Click on the color squares to customize your theme
        </div>
      </div>
    </>
  );
};
