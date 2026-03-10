INSERT INTO public.extensions (name, description, type, icon, code)
VALUES (
  'Diamond',
  'A classic geometric diamond shape.',
  'diamond',
  'Gem',
  '(function(LucideIcons) {
    return {
      type: "diamond",
      label: "Diamond",
      icon: LucideIcons.Gem,
      create: (x, y) => ({
        id: Math.random().toString(36).substr(2, 9),
        type: "diamond",
        x,
        y,
        size: 4
      }),
      render: (ctx, element, isSelected, visualCellSize) => {
        const x = element.x * visualCellSize + visualCellSize / 2;
        const y = element.y * visualCellSize + visualCellSize / 2;
        const s = element.size * visualCellSize;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s, y);
        ctx.closePath();
        ctx.strokeStyle = isSelected ? "#0000FF" : "#000000";
        ctx.lineWidth = 2;
        ctx.stroke();
      },
      getBounds: (element) => ({
        left: element.x - element.size,
        top: element.y - element.size,
        right: element.x + element.size + 1,
        bottom: element.y + element.size + 1
      }),
      toAscii: (element, grid, offset) => {
        const cx = element.x - offset.x;
        const cy = element.y - offset.y;
        const s = element.size;
        for (let i = 0; i <= s; i++) {
          if (cy - s + i >= 0 && cy - s + i < grid.length) {
            if (cx - i >= 0 && cx - i < grid[0].length) grid[cy - s + i][cx - i] = "/";
            if (cx + i >= 0 && cx + i < grid[0].length) grid[cy - s + i][cx + i] = "\\";
          }
          if (cy + s - i >= 0 && cy + s - i < grid.length) {
            if (cx - i >= 0 && cx - i < grid[0].length) grid[cy + s - i][cx - i] = "\\";
            if (cx + i >= 0 && cx + i < grid[0].length) grid[cy + s - i][cx + i] = "/";
          }
        }
      }
    };
  })(LucideIcons)'
);
