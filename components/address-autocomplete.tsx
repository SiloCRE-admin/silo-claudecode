'use client'

import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface PlaceData {
  placeId: string
  formattedAddress: string
  lat: number
  lng: number
  addressComponents: google.maps.GeocoderAddressComponent[]
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: PlaceData) => void
  placeholder?: string
  required?: boolean
  id?: string
  className?: string
}

// Track if options have been set
let optionsInitialized = false

function initializeOptions() {
  if (optionsInitialized) return true

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Address autocomplete will be disabled.')
    return false
  }

  setOptions({
    key: apiKey,
    v: 'weekly',
    libraries: ['places'],
  })
  optionsInitialized = true
  return true
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Enter an address',
  required = false,
  id = 'address-autocomplete',
  className = '',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [libraryLoadFailed, setLibraryLoadFailed] = useState(false)

  // Check API key availability - computed value, not state
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const loadError = !hasApiKey
    ? 'Google Maps API key not configured'
    : libraryLoadFailed
      ? 'Failed to load address suggestions'
      : null

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!initializeOptions()) {
      return
    }

    let isMounted = true

    importLibrary('places')
      .then(() => {
        if (!isMounted || !inputRef.current) return

        // Create autocomplete instance
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['place_id', 'formatted_address', 'geometry', 'address_components'],
        })

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          if (place?.formatted_address) {
            onChange(place.formatted_address)

            if (onPlaceSelect && place.place_id && place.geometry?.location) {
              const placeData: PlaceData = {
                placeId: place.place_id,
                formattedAddress: place.formatted_address,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                addressComponents: place.address_components || [],
              }
              console.log('[AddressAutocomplete] Place selected:', placeData)
              onPlaceSelect(placeData)
            }
          }
        })

        setIsLoaded(true)
      })
      .catch((err: Error) => {
        console.error('Failed to load Google Places:', err)
        if (isMounted) {
          setLibraryLoadFailed(true)
        }
      })

    return () => {
      isMounted = false
      // Clean up autocomplete listeners
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onChange, onPlaceSelect])

  // Prevent form submission on Enter when autocomplete dropdown is open
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && document.querySelector('.pac-container')) {
      // pac-container is the Google autocomplete dropdown
      const dropdown = document.querySelector('.pac-container')
      if (dropdown && window.getComputedStyle(dropdown).display !== 'none') {
        e.preventDefault()
      }
    }
  }, [])

  const defaultClassName =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500'

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={className || defaultClassName}
        autoComplete="off"
      />
      {loadError && (
        <p className="mt-1 text-xs text-amber-600">{loadError}</p>
      )}
      {!isLoaded && !loadError && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="mt-1 text-xs text-gray-400">Loading address suggestions...</p>
      )}
    </div>
  )
}
