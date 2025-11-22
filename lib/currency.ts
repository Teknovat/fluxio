// Currency configuration
export interface CurrencyConfig {
    code: string;
    symbol: string;
    locale: string;
    name: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
    EUR: {
        code: "EUR",
        symbol: "€",
        locale: "fr-FR",
        name: "Euro",
    },
    TND: {
        code: "TND",
        symbol: "د.ت",
        locale: "ar-TN",
        name: "Dinar Tunisien",
    },
    USD: {
        code: "USD",
        symbol: "$",
        locale: "en-US",
        name: "Dollar US",
    },
    MAD: {
        code: "MAD",
        symbol: "د.م.",
        locale: "ar-MA",
        name: "Dirham Marocain",
    },
};

// Default currency
const DEFAULT_CURRENCY = "TND";

// Get currency from localStorage or use default
export const getCurrency = (): CurrencyConfig => {
    if (typeof window === "undefined") {
        return CURRENCIES[DEFAULT_CURRENCY];
    }

    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency && CURRENCIES[savedCurrency]) {
        return CURRENCIES[savedCurrency];
    }

    return CURRENCIES[DEFAULT_CURRENCY];
};

// Save currency to localStorage
export const setCurrency = (currencyCode: string): void => {
    if (typeof window !== "undefined" && CURRENCIES[currencyCode]) {
        localStorage.setItem("currency", currencyCode);
    }
};

// Format amount with current currency
export const formatAmount = (amount: number, currencyCode?: string): string => {
    const currency = currencyCode ? CURRENCIES[currencyCode] || getCurrency() : getCurrency();

    return new Intl.NumberFormat(currency.locale, {
        style: "currency",
        currency: currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};
