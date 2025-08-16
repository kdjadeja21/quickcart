import { useState, useEffect } from "react";
import { Currency, getCurrencyByCode } from "@/lib/currency";

export function useCurrencyDetection(): Currency {
  const [currency, setCurrency] = useState<Currency>(getCurrencyByCode("INR"));

  useEffect(() => {
    async function detectCurrency() {
      try {
        const response = await fetch("/api/location");
        const data = await response.json();

        if (data.currency) {
          const detectedCurrency = getCurrencyByCode(data.currency);
          setCurrency(detectedCurrency);
        }
      } catch (error) {
        console.error("Error detecting currency:", error);
      }
    }

    detectCurrency();
  }, []);

  return currency;
}
