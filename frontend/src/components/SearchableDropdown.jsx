import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export default function SearchableDropdown({
  items = [], // Array of { value, label }
  selectedValue = '',
  onSelect,
  placeholder = 'Select item...',
  disabled = false,
  id = 'searchable-dropdown',
  direction = 'down' // 'down' or 'up'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items based on search query
  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find currently selected label
  const selectedItem = items.find(item => item.value === selectedValue);
  const displayValue = selectedItem ? selectedItem.label : '';

  // Reset highlighted index when filter changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  // Adjust scroll position to keep highlighted item in view
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

  // Keyboard navigation handler
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
    onSelect(item.value);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect('');
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button/Input Wrapper */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-haspopup="listbox"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        className={`w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 flex items-center justify-between transition select-none ${
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00]'
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
              className="p-1 text-gray-500 hover:text-white rounded transition hover:bg-white/5"
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

      {/* Dropdown Options Container */}
      {isOpen && (
        <div className={`absolute left-0 right-0 z-50 bg-[#121826]/95 border border-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden backdrop-blur-md animate-scale-in ${
          direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          {/* Search Box inside dropdown */}
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

          {/* Listbox */}
          <ul
            id={`${id}-listbox`}
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto divide-y divide-white/[0.02]"
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
                    <span>{item.label}</span>
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
