'use client';

import { useState, useRef, useEffect } from 'react';

interface DestinationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Major travel destinations worldwide
const POPULAR_DESTINATIONS = [
  // Asia
  'Tokyo, Japan',
  'Kyoto, Japan',
  'Osaka, Japan',
  'Yokohama, Japan',
  'Seoul, South Korea',
  'Busan, South Korea',
  'Bangkok, Thailand',
  'Phuket, Thailand',
  'Chiang Mai, Thailand',
  'Singapore',
  'Hong Kong',
  'Bali, Indonesia',
  'Jakarta, Indonesia',
  'Dubai, UAE',
  'Abu Dhabi, UAE',
  'Mumbai, India',
  'Delhi, India',
  'Bangalore, India',
  'Kolkata, India',
  'Chennai, India',
  'Ho Chi Minh City, Vietnam',
  'Hanoi, Vietnam',
  'Manila, Philippines',
  'Kuala Lumpur, Malaysia',
  'Taipei, Taiwan',
  'Shanghai, China',
  'Beijing, China',
  'Guangzhou, China',
  'Shenzhen, China',
  'Chengdu, China',
  'Kathmandu, Nepal',
  'Colombo, Sri Lanka',
  
  // Europe
  'Paris, France',
  'Lyon, France',
  'Nice, France',
  'Marseille, France',
  'London, UK',
  'Manchester, UK',
  'Edinburgh, Scotland',
  'Dublin, Ireland',
  'Rome, Italy',
  'Milan, Italy',
  'Venice, Italy',
  'Florence, Italy',
  'Naples, Italy',
  'Barcelona, Spain',
  'Madrid, Spain',
  'Seville, Spain',
  'Valencia, Spain',
  'Amsterdam, Netherlands',
  'Rotterdam, Netherlands',
  'Berlin, Germany',
  'Munich, Germany',
  'Hamburg, Germany',
  'Frankfurt, Germany',
  'Cologne, Germany',
  'Vienna, Austria',
  'Salzburg, Austria',
  'Prague, Czech Republic',
  'Budapest, Hungary',
  'Warsaw, Poland',
  'Krakow, Poland',
  'Athens, Greece',
  'Santorini, Greece',
  'Mykonos, Greece',
  'Lisbon, Portugal',
  'Porto, Portugal',
  'Stockholm, Sweden',
  'Gothenburg, Sweden',
  'Copenhagen, Denmark',
  'Oslo, Norway',
  'Bergen, Norway',
  'Reykjavik, Iceland',
  'Zurich, Switzerland',
  'Geneva, Switzerland',
  'Brussels, Belgium',
  'Antwerp, Belgium',
  'Istanbul, Turkey',
  'Ankara, Turkey',
  'Moscow, Russia',
  'Saint Petersburg, Russia',
  
  // North America - USA
  'New York City, New York, USA',
  'Los Angeles, California, USA',
  'Chicago, Illinois, USA',
  'Houston, Texas, USA',
  'Phoenix, Arizona, USA',
  'Philadelphia, Pennsylvania, USA',
  'San Antonio, Texas, USA',
  'San Diego, California, USA',
  'Dallas, Texas, USA',
  'San Jose, California, USA',
  'Austin, Texas, USA',
  'Jacksonville, Florida, USA',
  'San Francisco, California, USA',
  'Indianapolis, Indiana, USA',
  'Columbus, Ohio, USA',
  'Fort Worth, Texas, USA',
  'Charlotte, North Carolina, USA',
  'Seattle, Washington, USA',
  'Denver, Colorado, USA',
  'Washington, DC, USA',
  'Boston, Massachusetts, USA',
  'El Paso, Texas, USA',
  'Nashville, Tennessee, USA',
  'Detroit, Michigan, USA',
  'Oklahoma City, Oklahoma, USA',
  'Portland, Oregon, USA',
  'Las Vegas, Nevada, USA',
  'Memphis, Tennessee, USA',
  'Louisville, Kentucky, USA',
  'Baltimore, Maryland, USA',
  'Milwaukee, Wisconsin, USA',
  'Albuquerque, New Mexico, USA',
  'Tucson, Arizona, USA',
  'Fresno, California, USA',
  'Sacramento, California, USA',
  'Kansas City, Missouri, USA',
  'Mesa, Arizona, USA',
  'Atlanta, Georgia, USA',
  'Omaha, Nebraska, USA',
  'Colorado Springs, Colorado, USA',
  'Raleigh, North Carolina, USA',
  'Miami, Florida, USA',
  'Long Beach, California, USA',
  'Virginia Beach, Virginia, USA',
  'Oakland, California, USA',
  'Minneapolis, Minnesota, USA',
  'Tulsa, Oklahoma, USA',
  'Tampa, Florida, USA',
  'Cleveland, Ohio, USA',
  'Wichita, Kansas, USA',
  'Arlington, Texas, USA',
  'New Orleans, Louisiana, USA',
  'Honolulu, Hawaii, USA',
  'Orlando, Florida, USA',
  'Salt Lake City, Utah, USA',
  'Buffalo, New York, USA',
  'Riverside, California, USA',
  'St. Louis, Missouri, USA',
  'Pittsburgh, Pennsylvania, USA',
  'Anchorage, Alaska, USA',
  
  // North America - Canada
  'Toronto, Canada',
  'Vancouver, Canada',
  'Montreal, Canada',
  'Calgary, Canada',
  'Ottawa, Canada',
  'Edmonton, Canada',
  'Winnipeg, Canada',
  'Quebec City, Canada',
  'Halifax, Canada',
  
  // North America - Other
  'Mexico City, Mexico',
  'Cancun, Mexico',
  'Guadalajara, Mexico',
  'Monterrey, Mexico',
  'Havana, Cuba',
  'San Juan, Puerto Rico',
  
  // South America
  'São Paulo, Brazil',
  'Rio de Janeiro, Brazil',
  'Brasília, Brazil',
  'Salvador, Brazil',
  'Buenos Aires, Argentina',
  'Córdoba, Argentina',
  'Lima, Peru',
  'Bogotá, Colombia',
  'Medellín, Colombia',
  'Santiago, Chile',
  'Caracas, Venezuela',
  'Quito, Ecuador',
  'Montevideo, Uruguay',
  'Asunción, Paraguay',
  
  // Africa
  'Cairo, Egypt',
  'Alexandria, Egypt',
  'Cape Town, South Africa',
  'Johannesburg, South Africa',
  'Durban, South Africa',
  'Marrakech, Morocco',
  'Casablanca, Morocco',
  'Nairobi, Kenya',
  'Lagos, Nigeria',
  'Accra, Ghana',
  'Tunis, Tunisia',
  'Zanzibar, Tanzania',
  'Addis Ababa, Ethiopia',
  
  // Oceania
  'Sydney, Australia',
  'Melbourne, Australia',
  'Brisbane, Australia',
  'Perth, Australia',
  'Adelaide, Australia',
  'Auckland, New Zealand',
  'Wellington, New Zealand',
  'Queenstown, New Zealand',
  'Christchurch, New Zealand',
  'Fiji',
  'Bora Bora, French Polynesia',
  'Honolulu, Hawaii, USA',
];

export default function DestinationInput({
  value,
  onChange,
  placeholder = 'e.g., Tokyo, Japan',
  className = '',
}: DestinationInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const filtered = POPULAR_DESTINATIONS.filter(dest =>
        dest.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDestinations(filtered.slice(0, 15)); // Show max 15 results
    } else {
      setFilteredDestinations(POPULAR_DESTINATIONS.slice(0, 15));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (destination: string) => {
    onChange(destination);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        required
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {isOpen && filteredDestinations.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-tan-lighter dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto transition-all duration-200"
        >
          {filteredDestinations.map((destination, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(destination)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg text-gray-900 dark:text-gray-100"
            >
              <span className="text-sm font-medium">{destination}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
