# Crunchyroll Advanced Search

A powerful web application for searching and filtering Crunchyroll's anime catalog with features that Crunchyroll doesn't provide.

## 🎯 Why This Project Exists

Crunchyroll's built-in search is limited and lacks advanced filtering capabilities. This project solves that by providing:

- **Advanced Filtering**: Filter by genres, tags, studios, content descriptors, and more
- **Enhanced Metadata**: Integrates AniList data for comprehensive anime information
- **Tri-State Filters**: Include, exclude, or ignore specific criteria
- **Better Discovery**: Find exactly what you want with granular search options
- **Rich Information**: See both Crunchyroll and AniList ratings, years, tags, and studios

Crunchyroll's metadata is often incomplete. We enhance it with data from AniList to give you:
- Genre classifications
- Detailed tags (900+ unique tags)
- Studio information
- Release status
- Additional ratings and popularity metrics

## ✨ Features

### Search & Filter
- **Text Search**: Search by title or description
- **Genre Filters**: Include/exclude specific genres
- **Tag Filters**: 900+ tags with searchable list
- **Studio Filters**: Filter by animation studio
- **Status Filters**: Filter by release status (Releasing, Finished, Not Yet Released)
- **Content Descriptors**: Filter by content warnings
- **Basic Filters**: Mature content, dubbed, subbed, minimum rating

### User Experience
- **Collapsible Sections**: Clean, organized filter interface
- **Result Counts**: See how many anime match each filter
- **Active Filter Tracking**: Display of active filters in section headers
- **Clickable Tags**: Click any tag to add it as a filter
- **Pagination**: Adjustable results per page (16, 32, 64, 128)
- **Direct Links**: Click anime cards to go straight to Crunchyroll

### Data Quality
- **Daily Updates**: Automatic updates from Crunchyroll's catalog
- **Change Tracking**: Logs of what anime were added/removed
- **Snapshot Timestamps**: Know when the data was last updated
- **Dual Ratings**: Both Crunchyroll and AniList ratings displayed

## 🚀 Live Demo

Visit the live application: [https://af-chacon.github.io/CrunchyRollAdvancedSearch/](https://af-chacon.github.io/CrunchyRollAdvancedSearch/)

## 📊 Current Stats

- **1919** anime in the catalog
- **900+** unique tags from AniList
- **Daily** automatic updates
- **Zero** login required

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Custom CSS with dark theme
- **Data Sources**: Crunchyroll API + AniList GraphQL API
- **Deployment**: GitHub Pages
- **Automation**: Systemd timers + GitHub Actions
- **Code Quality**: ESLint + SonarJS (strict mode)

## 📖 How to Use

1. **Visit the site**: Go to the live demo link above
2. **Search**: Use the search bar or browse by filters
3. **Filter**: Click filter categories to expand and select criteria
4. **Include/Exclude**: Use tri-state buttons (✓ include, ✗ exclude, default)
5. **Click Tags**: Any tag on an anime card can be clicked to add as filter
6. **View Details**: Click an anime card to open it on Crunchyroll

## 🐛 Found a Bug? Have a Suggestion?

We welcome bug reports and feature requests!

**Report an issue**: [GitHub Issues](https://github.com/af-chacon/CrunchyRollAdvancedSearch/issues)

Please include:
- Description of the issue or feature request
- Steps to reproduce (for bugs)
- Screenshots if applicable
- Your browser and OS

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and commit (`git commit -m 'Add amazing feature'`)
4. **Push** to your fork (`git push origin feature/amazing-feature`)
5. **Open a Pull Request** against the `main` branch

### Branch Protection Rules

The `main` branch is protected:
- Direct commits are **not allowed**
- All changes must go through **pull requests**
- Pull requests must be from **forks** (not branches)
- Only **squash merges** are permitted
- **ESLint must pass** (strict mode, zero warnings tolerated)
- Commits must have **verified signatures**

This keeps the commit history clean and ensures all changes are reviewed and meet quality standards.

## 📁 Project Structure

```
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── types.ts       # TypeScript definitions
│   │   ├── App.tsx        # Main application
│   │   └── App.css        # Styles
│   └── public/
│       └── anime.json     # Anime catalog data
├── scripts/
│   ├── python/            # Python automation scripts
│   │   ├── update_anime_data.py  # Daily update script
│   │   ├── enhance_anime.py      # AniList enhancement
│   │   └── requirements.txt      # Python dependencies
│   ├── update-and-deploy.sh      # Systemd automation
│   ├── crunchyroll-update.service
│   └── crunchyroll-update.timer
├── .github/workflows/     # GitHub Actions (deploy, lint, update)
└── data_change_logs/      # Change tracking logs
```

## 🔄 Automated Updates

The anime catalog updates automatically every day at 1:00 AM EDT via systemd timer:

- Fetches latest data from Crunchyroll
- Enhances with AniList metadata using fuzzy matching
- Validates API format changes (fails safely)
- Creates pull requests automatically
- Auto-merges after validation
- Tracks additions, removals, and changes
- Maintains change logs for analysis

See [DATA_UPDATE_SETUP.md](DATA_UPDATE_SETUP.md) for details.

## 🧪 Development

### Prerequisites
- Node.js 20+
- Python 3.11+

### Setup

```bash
# Clone the repository
git clone https://github.com/af-chacon/CrunchyRollAdvancedSearch.git
cd CrunchyRollAdvancedSearch

# Install frontend dependencies
cd frontend
npm install

# Run development server
npm run dev
```

### Build for Production

```bash
cd frontend
npm run build
```

### Update Anime Data

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run update script (includes Crunchyroll + AniList enhancement)
python update_anime_data.py
```

### Code Quality Checks

```bash
cd frontend

# Run linter
npm run lint

# Auto-fix issues
npm run lint:fix

# Generate detailed report
npm run lint:report
```

## 🤖 Built with AI

This project was developed primarily using **Claude Code** (Anthropic's Claude AI) and **Playwright MCP** (Model Context Protocol).

### Development Process

- **AI-Powered Development**: Most of the code, architecture, and features were created through conversations with Claude Code
- **Playwright MCP**: Used for browser automation and testing during development
- **Iterative Refinement**: UI/UX improvements were guided by real-time testing and feedback
- **Human-AI Collaboration**: Project direction and decisions made collaboratively

### What Claude Built

- Complete React/TypeScript frontend with tri-state filtering system
- Extensible component architecture that auto-updates with new data
- Python scripts for data fetching and AniList enhancement
- GitHub Actions workflows for automated updates and deployment
- Comprehensive documentation and contribution guidelines
- UI/UX design with responsive layouts and dark theme

This showcases how AI can be used as a powerful development tool while maintaining high code quality and following best practices.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Note**: The anime data used by this application is owned by Crunchyroll and AniList respectively and is subject to their respective terms of service.

## 🙏 Acknowledgments

- **Anthropic Claude** for AI-assisted development
- **Playwright MCP** for browser automation tooling
- **Crunchyroll** for the anime catalog API
- **AniList** for comprehensive anime metadata
- **GitHub Pages** for free hosting
- **The anime community** for inspiration

## 📞 Contact

- **GitHub Issues**: For bugs and features
- **Project Owner**: [@af-chacon](https://github.com/af-chacon)

---

**Note**: This is an unofficial fan project and is not affiliated with Crunchyroll or AniList.
