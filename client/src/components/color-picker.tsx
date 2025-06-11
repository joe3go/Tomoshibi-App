
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface ColorPickerProps {
  initialColor: string;
  label: string;
  onColorChange: (color: string) => void;
  cssVariable?: string;
  className?: string;
}

const InlineColorPicker: React.FC<ColorPickerProps> = ({
  initialColor,
  label,
  onColorChange,
  cssVariable,
  className = ''
}) => {
  const [color, setColor] = useState(initialColor);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onColorChange(newColor);
    
    if (cssVariable) {
      const hslValue = hexToHsl(newColor);
      document.documentElement.style.setProperty(`--${cssVariable}`, hslValue);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border border-gray-300 hover:border-gray-400 transition-colors ${className}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-mono text-gray-700">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{label}</label>
            <div
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: color }}
            />
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-10 rounded border border-gray-300 cursor-pointer"
          />
          <div className="text-xs text-gray-500">
            Hex: {color}
            <br />
            HSL: {hexToHsl(color)}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const ColorPicker: React.FC = () => {
  const [colors, setColors] = useState({
    background: '#f0e9e4', // hsl(35, 25%, 92%)
    header: '#855a5a',     // hsl(354, 33%, 36%)
    card: '#3d3f47'        // hsl(221, 21%, 24%)
  });

  const updateColor = (colorType: keyof typeof colors, newColor: string) => {
    setColors(prev => ({ ...prev, [colorType]: newColor }));
    
    // Apply changes to the DOM
    switch (colorType) {
      case 'background':
        document.body.style.background = newColor;
        break;
      case 'header':
        const navbars = document.querySelectorAll('.navbar, .bottom-nav');
        navbars.forEach(navbar => {
          (navbar as HTMLElement).style.background = newColor;
        });
        break;
      case 'card':
        const cards = document.querySelectorAll('.content-card');
        cards.forEach(card => {
          (card as HTMLElement).style.background = newColor;
        });
        break;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">🎨 Color Editor</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-20">Background:</span>
          <InlineColorPicker
            initialColor={colors.background}
            label="bg"
            onColorChange={(color) => updateColor('background', color)}
            cssVariable="background"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-20">Header:</span>
          <InlineColorPicker
            initialColor={colors.header}
            label="nav"
            onColorChange={(color) => updateColor('header', color)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-20">Cards:</span>
          <InlineColorPicker
            initialColor={colors.card}
            label="card"
            onColorChange={(color) => updateColor('card', color)}
            cssVariable="card"
          />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Click color swatches to open picker popups
        </p>
      </div>
    </div>
  );
};

export default ColorPicker;
