import React, { useState, useEffect } from 'react';
import './LanguageDropdown.css';

const LANGUAGES_FILE = '/languages.json'; // Path to JSON file in public folder

const LanguageDropdown = ({ selectedLanguage, onSelectLanguage }) => {
    const [languages, setLanguages] = useState([]);
    const [filteredLanguages, setFilteredLanguages] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetch language data from JSON file
        fetch(LANGUAGES_FILE)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const defaultLanguageCode = 'auto';
                let sortedLanguages = data;

                // Move default language (e.g., English) to the top
                sortedLanguages.sort((a, b) => {
                    if (a.code === defaultLanguageCode) return -1;
                    if (b.code === defaultLanguageCode) return 1;
                    return a.name.localeCompare(b.name);
                });

                setLanguages(sortedLanguages);
                setFilteredLanguages(sortedLanguages);

                // Set default language if none is selected
                if (!selectedLanguage) {
                    onSelectLanguage(defaultLanguageCode);
                }
            })
            .catch(error => console.error('Error fetching language data:', error));
    }, [selectedLanguage, onSelectLanguage]);

    useEffect(() => {
        // Filter languages based on search term
        const filtered = languages.filter(lang =>
            lang.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredLanguages(filtered);
    }, [searchTerm, languages]);

    const toggleDropdown = () => {
        setIsOpen(prevState => !prevState);
    };

    const handleLanguageSelect = (code) => {
        onSelectLanguage(code);
        setIsOpen(false);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    
    return (
        <div className="language-dropdown-container">
            <div className="dropdown" role="listbox" aria-labelledby="language-selector">
                <button
                    id="language-selector"
                    className="dropbtn"
                    onClick={toggleDropdown}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                >
                    {selectedLanguage && (
                        <img src={languages.find(lang => lang.code === selectedLanguage)?.flag} alt={`Flag of selected language`} className="dropdown-flag" />
                    )}
                    {languages.find(lang => lang.code === selectedLanguage)?.name || 'Select Language'}
                </button>
                <div className={`dropdown-content ${isOpen ? 'open' : ''}`}>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-input"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <ul role="listbox">
                        {filteredLanguages.map((lang) => (
                            <li
                                key={lang.code}
                                className={`dropdown-item ${lang.code === selectedLanguage ? 'selected' : ''}`}
                                role="option"
                                aria-selected={lang.code === selectedLanguage}
                                onClick={() => handleLanguageSelect(lang.code)}
                            >
                                <img src={lang.flag} alt={`Flag of ${lang.name}`} className="dropdown-flag" />
                                {lang.name} ({lang.code})
                                {lang.code === selectedLanguage && (
                                    <span className="tick">
                                        <img src="https://cdn.jsdelivr.net/npm/heroicons@1.0.6/outline/check-circle.svg" alt="Tick" />
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );

export default LanguageDropdown;
