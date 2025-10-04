# Contributing to Crunchyroll Advanced Search

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🌟 How to Contribute

### Reporting Bugs

Found a bug? Help us fix it!

1. **Check existing issues** first to avoid duplicates
2. **Create a new issue** at [GitHub Issues](https://github.com/af-chacon/CrunchyRollAdvancedSearch/issues)
3. **Include details**:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser and OS information

### Suggesting Features

Have an idea? We'd love to hear it!

1. **Check existing issues** to see if it's already suggested
2. **Create a feature request** issue
3. **Describe**:
   - The feature you'd like to see
   - Why it would be useful
   - Any implementation ideas (optional)

### Code Contributions

#### Fork and Pull Request Workflow

1. **Fork the repository**
   - Click "Fork" button on GitHub
   - Clone your fork: `git clone https://github.com/YOUR-USERNAME/CrunchyRollAdvancedSearch.git`

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

   Use clear branch names:
   - `feature/add-theme-toggle`
   - `fix/search-bar-overflow`
   - `docs/update-readme`

3. **Make your changes**
   - Write clean, commented code
   - Follow existing code style
   - Test your changes thoroughly
   - Update documentation if needed

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature: your feature description"
   ```

   Write clear commit messages:
   - Start with a verb (Add, Fix, Update, etc.)
   - Be specific about what changed
   - Reference issues if applicable (#123)

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template with:
     - Description of changes
     - Related issues
     - Testing done
     - Screenshots (for UI changes)

#### Branch Protection Rules

The `main` branch is protected with the following rules:

- ✅ **Require pull requests** - No direct commits allowed
- ✅ **Require fork** - PRs must come from forks, not branches
- ✅ **Squash merging only** - Keeps history clean
- ✅ **Delete branch after merge** - Automatic cleanup

This ensures all changes are reviewed and the commit history stays clean.

## 🔧 Development Setup

### Prerequisites

- Node.js 20 or higher
- Python 3.11 or higher
- Git

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

The dev server runs at `http://localhost:5173`

### Data Updates

```bash
# Install Python dependencies
pip install requests

# Test data update locally
python update_anime_data.py

# Test AniList enhancement
python enhance_anime.py
```

## 📋 Code Guidelines

### React/TypeScript

- Use functional components with hooks
- Type all props and state with TypeScript
- Keep components focused and reusable
- Use meaningful variable names
- Comment complex logic

### CSS

- Follow existing naming conventions
- Keep selectors specific but not overly nested
- Use CSS variables for colors and spacing
- Test in both light and dark themes
- Ensure responsive design

### Python

- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Document functions with docstrings
- Handle errors gracefully
- Add logging for debugging

## 🧪 Testing

Before submitting a PR:

1. **Test functionality** - Ensure your changes work as expected
2. **Test edge cases** - Try different inputs and scenarios
3. **Test responsiveness** - Check different screen sizes
4. **Test browsers** - Verify in Chrome, Firefox, Safari
5. **Check console** - No errors in browser console
6. **Run linter** - `npm run lint` should pass

## 📝 Pull Request Process

1. **Update documentation** if you changed functionality
2. **Add comments** to explain complex code
3. **Keep PRs focused** - One feature/fix per PR
4. **Respond to feedback** - Address review comments promptly
5. **Keep up to date** - Rebase on main if needed

### PR Review Process

- Maintainers will review your PR
- May request changes or ask questions
- Once approved, it will be squash merged
- Your contribution will be in the next deployment!

## 🎨 UI/UX Contributions

For design changes:

- Maintain consistency with existing design
- Consider accessibility (colors, contrast, keyboard nav)
- Test with different content lengths
- Provide screenshots in PR
- Explain design decisions

## 📊 Data Contributions

For data-related changes:

- Explain the data source
- Document any new fields
- Ensure backward compatibility
- Test with real data
- Consider performance impact

## ⚡ Performance

Keep performance in mind:

- Minimize unnecessary re-renders
- Lazy load when possible
- Optimize images and assets
- Test with large datasets
- Profile if adding complex features

## 🙋 Questions?

- **Not sure about something?** Open an issue to discuss
- **Need help?** Ask in your PR or issue
- **Want to chat?** Open a discussion on GitHub

## 🎉 Recognition

All contributors are valued! Your username will be listed in:
- Git history
- Release notes (for significant contributions)
- Special recognition for regular contributors

Thank you for helping make Crunchyroll Advanced Search better! 🚀
