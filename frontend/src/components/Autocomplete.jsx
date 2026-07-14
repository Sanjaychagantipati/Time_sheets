import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export default function Autocomplete({
  items = [], // Array of { value, label, subtext }
  selectedValue = '',
  onSelect, // callback when value is selected: (value, item) => void
  placeholder = 'Type to search...',
  disabled = false,
  id = 'autocomplete-dropdown',
  heightClass = 'h-14',
  searchInside = false, // If true, behaves like SearchableDropdown (input inside dropdown)
  direction = 'down' // dropdown opening direction: 'down' or 'up'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Used when searchInside is true
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  // Synchronize input/search value with selectedValue changes
  const selectedItem = useMemo(() => {
    return items.find(item => item.value === selectedValue);
  }, [items, selectedValue]);

  useEffect(() => {
    if (selectedItem) {
      setInputValue(selectedItem.label);
    } else if (!selectedValue) {
      setInputValue('');
    }
  }, [selectedValue, selectedItem]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (searchInside) {
      if (!searchQuery) return items;
      return items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      if (!inputValue) return items;
      if (selectedItem && selectedItem.label === inputValue) {
        return items;
      }
      return items.filter(item =>
        item.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    }
  }, [items, inputValue, searchQuery, selectedItem, searchInside]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight index when filtering
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [inputValue, searchQuery]);

  // Adjust scroll position for keyboard navigation
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.childNodes[highlightedIndex];
      if (highlightedEl) {
        highlightedEl.scrollIntoView({
          block: 'nearest'
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setHighlightedIndex(prev =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        e.preventDefault();
        break;
      case 'ArrowUp':
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        e.preventDefault();
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
          handleItemSelect(filteredItems[highlightedIndex]);
        } else if (filteredItems.length > 0) {
          handleItemSelect(filteredItems[0]);
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        e.preventDefault();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleItemSelect = (item) => {
    if (!searchInside) {
      setInputValue(item.label);
    }
    onSelect(item.value, item);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    const matchingItem = items.find(item => item.label.toLowerCase() === val.toLowerCase());
    if (matchingItem) {
      onSelect(matchingItem.value, matchingItem);
    } else {
      onSelect('', null);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    setSearchQuery('');
    onSelect('', null);
    setIsOpen(true);
  };

  const displayValue = selectedItem ? selectedItem.label : '';

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {searchInside ? (
        /* Behavior 1: Trigger is a select box, search is inside dropdown */
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-haspopup="listbox"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          className={`w-full ${heightClass} bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 flex items-center justify-between transition select-none focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] ${
            disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
          }`}
        >
          <div className="flex-1 truncate mr-2">
            {displayValue ? (
              <span className="text-white font-medium text-sm">{displayValue}</span>
            ) : (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {displayValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-500 hover:text-white rounded transition hover:bg-white/5 cursor-pointer"
                aria-label="Clear selection"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#FF7A00]' : ''}`}
            />
          </div>
        </div>
      ) : (
        /* Behavior 2: Trigger is a text input field (Autocomplete default) */
        <div className="relative flex items-center">
          <input
            id={id}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => !disabled && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className={`w-full ${heightClass} bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-4 pr-10 text-sm transition focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] ${
              disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-text'
            }`}
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            {inputValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-500 hover:text-white rounded transition hover:bg-white/5 cursor-pointer"
                aria-label="Clear selection"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 cursor-pointer ${
                isOpen ? 'rotate-180 text-[#FF7A00]' : ''
              }`}
              onClick={() => !disabled && setIsOpen(!isOpen)}
            />
          </div>
        </div>
      )}

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div className={`absolute left-0 right-0 z-50 bg-[#121826]/95 border border-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden backdrop-blur-md animate-scale-in ${
          direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          {/* Inner Search Box when searchInside is true */}
          {searchInside && (
            <div className="p-2.5 border-b border-white/5 flex items-center gap-2 bg-black/10">
              <Search size={14} className="text-gray-500 ml-1.5" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent border-0 text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-0 py-1"
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            className="max-h-60 overflow-y-auto divide-y divide-white/[0.02] no-scrollbar"
          >
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const isSelected = item.value === selectedValue;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={item.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleItemSelect(item)}
                    className={`px-4 py-3 text-xs font-medium cursor-pointer transition select-none flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FF7A00]/20 text-[#FF7A00]'
                        : isHighlighted
                        ? 'bg-white/5 text-white'
                        : 'text-gray-300 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{item.label}</span>
                      {item.subtext && (
                        <span className="text-[10px] text-gray-400 mt-0.5">{item.subtext}</span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-4 text-xs text-gray-500 italic text-center select-none">
                No items found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
