// Goong.io API Response Types

export interface GoongPrediction {
    description: string;
    place_id: string;
    reference: string;
    matched_substrings?: MatchedSubstring[];
    structured_formatting?: StructuredFormatting;
    terms?: Term[];
    types?: string[];
}

export interface MatchedSubstring {
    length: number;
    offset: number;
}

export interface StructuredFormatting {
    main_text: string;
    main_text_matched_substrings?: MatchedSubstring[];
    secondary_text?: string;
}

export interface Term {
    offset: number;
    value: string;
}

export interface GoongAutocompleteResponse {
    predictions: GoongPrediction[];
    status: string;
    error_message?: string;
}

export interface GoongLocation {
    lat: number;
    lng: number;
}

export interface GoongGeometry {
    location: GoongLocation;
    viewport?: {
        northeast: GoongLocation;
        southwest: GoongLocation;
    };
}

export interface GoongAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

export interface GoongPlaceDetail {
    address_components?: GoongAddressComponent[];
    formatted_address?: string;
    geometry?: GoongGeometry;
    name?: string;
    place_id: string;
    types?: string[];
    plus_code?: {
        compound_code?: string;
        global_code?: string;
    };
}

export interface GoongPlaceDetailResponse {
    result: GoongPlaceDetail;
    status: string;
    error_message?: string;
}

// API Response wrapper
export interface LocationApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}
