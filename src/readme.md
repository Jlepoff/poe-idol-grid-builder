# Path of Exile Idol Grid Builder

A web application for planning and optimizing your Idol layouts for Path of Exile.

![Idol Grid Builder Screenshot](screenshot.png)

## Features

- Create and customize idols with different prefixes and suffixes
- Drag and drop idols onto the grid
- Auto-optimize idol placement on grid
- Search, filter, and browse available modifiers
- Paste idols directly from Path of Exile in-game (Ctrl+V)
- Automatic idol generation based on desired modifiers
- Active modifiers summary with stacking calculations
- Keyboard shortcuts for improved workflow
- Mobile-friendly responsive design

## How to Use

### Building Idols
1. Select an idol type (Minor, Kamasan, Totemic, Noble, Conqueror, or Burial)
2. Search for and add prefixes and suffixes
3. Click "Create Idol" to add it to your inventory

### Adding Idols to the Grid
- Drag idols from your inventory to place them on the grid
- Right-click idols to remove them from the grid or inventory
- Click the "Auto-Optimize Grid" button to find an efficient arrangement

### Generate Idols Automatically
1. Go to the Auto-Generate tab
2. Add desired modifiers to the list
3. Click "Generate & Place Idols" to create and place idols with these modifiers

### Paste from Path of Exile
Simply copy an idol from Path of Exile and press Ctrl+V anywhere in the app to import it directly.

## Technologies Used
- React
- Tailwind CSS
- React DND (Drag and Drop)
- Lodash

## Development

### Prerequisites
- Node.js and npm

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/poe-idol-grid-builder.git
cd poe-idol-grid-builder

# Install dependencies
npm install

# Start the development server
npm start
```

### Building for Production
```bash
npm run build
```

## License
MIT

## Acknowledgements
- This project is not affiliated with Grinding Gear Games or Path of Exile
- Thanks to the Path of Exile community for their feedback and support