
import { CallLogEntry, CallOutcome, WebsiteStatus } from '../types';

export const getWhatsAppMessage = (entry: Partial<CallLogEntry>): string => {
  const name = entry.contactName || 'ahí';
  const business = entry.businessName || 'vuestro negocio';
  const date = entry.followUpDate || '[día]';
  const time = entry.followUpTime || '[hora]';

  switch (entry.outcome) {
    case CallOutcome.INTERESTED:
      return `Hola, soy Francesco, encantado.

Tal como te comenté por teléfono, ahora mismo estamos buscando casos de éxito en tu profesion para documentar resultados reales (visibilidad, contactos y reservas).

👉 Pack 2 (Web + SEO local)
Precio normal: 1.290€
👉 Te lo dejamos al precio del Pack 1: 690€

Además, como parte de esta oferta, el SEO mensual básico lo dejamos en 90€/mes en lugar de 120€.
Es totalmente opcional, aunque suele ayudar mucho a acelerar resultados.

A cambio, únicamente cuando la web esté funcionando y estés contento con el resultado, nos grabarías un breve vídeo-testimonio contando tu experiencia.

Aquí puedes ver nuestra web:
https://fgdigitalsystems.com

No hace falta decidir nada ahora, míralo con calma.`;

    case CallOutcome.NOT_NOW:
      return `Hola, soy Francesco.

Entiendo que ahora no sea el momento, sin problema 👍
Cuando más adelante te encaje retomarlo, lo vemos con calma y te explico cómo podríamos trabajarlo para casos como el tuyo, sin compromiso.`;

    case CallOutcome.ALREADY_GOT_SOMEONE:
      return `Hola, soy Francesco.

Genial 👍
En ese caso, si en algún momento quieres comparar resultados o una segunda opinión, estaré encantado de ayudarte.

Te dejo nuestra web por si te sirve de referencia:
👉 https://fgdigitalsystems.com`;

    case CallOutcome.FUTURE_POTENTIAL:
      return `Hola, soy Francesco.

Perfecto, tiene sentido 👍
Cuando estés en este punto, lo vemos con calma y te explico cómo solemos trabajar con casos como el tuyo.

Te dejo mientras tanto la web para que nos tengas ubicados:
👉 https://fgdigitalsystems.com`;

    case CallOutcome.BOOKED:
      return `Hola, soy Francesco.

Genial, entonces quedamos así 👍
Nos vemos el ${date} a las ${time} y en la llamada te explico todo con ejemplos claros y cómo lo aplicaríamos a casos similares al tuyo.

¡Hablamos pronto!`;

    default:
      const issue = entry.websiteStatus === WebsiteStatus.BROKEN || entry.websiteStatus === WebsiteStatus.WEAK 
        ? 'vuestra web' 
        : 'vuestra visibilidad en Google';
      return `Hola ${name}, soy Francesco. Acabo de llamar a ${business} por el tema de ${issue} pero no he podido localizarte. ¿Hablamos cuando puedas?`;
  }
};

export const openWhatsApp = (entry: Partial<CallLogEntry>) => {
  if (!entry.phone) return;
  
  // Clean phone number: remove all non-digits
  let cleanPhone = entry.phone.replace(/\D/g, '');
  
  // Assume Spanish country code (34) if number starts with 6, 7 or 9 and length is 9
  if (cleanPhone.length === 9 && (cleanPhone.startsWith('6') || cleanPhone.startsWith('7') || cleanPhone.startsWith('9'))) {
    cleanPhone = '34' + cleanPhone;
  }
  
  const text = getWhatsAppMessage(entry);
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
};
