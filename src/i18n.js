import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import ru from './locales/ru.json'
const i18n = createI18n({
    legacy: false, // wichtig für Composition API (<script setup>)
    locale: 'en', // Standardsprache
    fallbackLocale: 'de',
    messages: {
        de,
        en,
        es,
        ru
    }
})

export default i18n