# Crunchyroll Advanced Search

A modern, responsive web application for searching and filtering Crunchyroll anime catalog with advanced filters and pagination.

## Features

- **Search**: Full-text search across anime titles and descriptions
- **Smart Filtering**: Filter by mature content, dubbed, and subbed availability
- **Configurable Pagination**: Choose how many results to display per page (8, 16, 32, 64, or 100)
- **High-Quality Images**: 480x720 poster images with lazy loading and browser caching
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Fast Performance**: Built with React, TypeScript, and Vite for optimal speed

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite 7** - Fast build tool and dev server
- **CSS3** - Custom styling with modern features

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Data Setup

The application expects an `anime.json` file in the `public/` directory. To generate this file:

```bash
# From the project root
python convert_to_json.py
```

This will parse the `output.txt` file and generate a JSON file with all anime data.

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.tsx         # Application entry point
│   ├── types.ts         # TypeScript type definitions
│   └── index.css        # Global styles
├── public/
│   └── anime.json       # Anime data (generated)
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Features in Detail

### Search & Filtering
- Real-time search with instant results
- Multiple filter options that can be combined
- Automatic reset to page 1 when filters change

### Pagination
- Customizable items per page
- Previous/Next navigation
- Current page indicator
- Disabled state for boundary pages

### Performance
- Image lazy loading for faster initial load
- Aggressive browser caching with `force-cache`
- Async image decoding for non-blocking rendering
- Optimized bundle size

## Browser Support

Works on all modern browsers that support ES2020:
- Chrome 80+
- Firefox 74+
- Safari 13.1+
- Edge 80+

## License

This project is for educational purposes.
