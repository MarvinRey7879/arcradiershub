<script setup>
import { ref, onMounted } from 'vue';

const browserLang = ref('en');

onMounted(() => {
    const savedLang = localStorage.getItem('arc_tracker_lang');
    if (savedLang) {
        browserLang.value = savedLang;
    } else {
        const navLang = navigator.language || navigator.userLanguage;
        if (navLang) {
            if (navLang.startsWith('de')) browserLang.value = 'de';
            else if (navLang.startsWith('es')) browserLang.value = 'es';
            else browserLang.value = 'en';
        }
    }
});
</script>

<template>
    <div class="disclaimer-page">
        <div class="content-container">

            <div v-if="browserLang === 'de'">
                <h1>Rechtliche Hinweise & Disclaimer</h1>

                <section>
                    <h3>1. Inoffizielles Fan-Projekt</h3>
                    <p>
                        Diese Anwendung ("Loot Tracker") ist ein rein privat betriebenes, <strong>inoffizielles</strong>
                        Projekt der Community.
                        Es besteht keine geschäftliche Verbindung zu <strong>Embark Studios AB</strong>.
                        Diese Seite wird von Embark Studios weder unterstützt, gesponsert noch offiziell genehmigt.
                    </p>
                </section>

                <section>
                    <h3>2. Geistiges Eigentum (Embark Studios)</h3>
                    <p>
                        <strong>ARC Raiders®</strong> ist eine eingetragene Marke von Embark Studios AB.
                        Alle verwendeten Spielinhalte, Screenshots, Item-Icons, Logos und Designs sind geistiges
                        Eigentum von Embark Studios AB.
                    </p>
                    <p>
                        Die Verwendung dieser geschützten Materialien erfolgt auf dieser Website ausschließlich zu
                        dokumentarischen und informativen Zwecken
                        (Fair Use / Angemessene Verwendung), um Spielern Hilfestellung zu leisten.
                    </p>
                </section>

                <section>
                    <h3>3. Datenquellen</h3>
                    <p>
                        Alle auf dieser Website bereitgestellten Informationen (z.B. Item-Werte, Preise, Fundorte)
                        wurden aus dem Spiel selbst sowie aus allgemein
                        öffentlich zugänglichen Community-Quellen zusammengetragen.
                    </p>
                </section>

                <section>
                    <h3>4. Haftungsausschluss & Updates</h3>
                    <p>
                        Alle Angaben sind ohne Gewähr. Da es sich um ein Live-Service-Spiel handelt, können sich Werte
                        und Mechaniken durch
                        <strong>Updates und Patches</strong> jederzeit ändern.
                        Wir übernehmen keine Haftung für Verluste im Spiel oder fehlerhafte Entscheidungen (z.B.
                        versehentlicher Verkauf von Items),
                        die auf der Nutzung dieses Tools basieren.
                    </p>
                </section>
            </div>

            <div v-else-if="browserLang === 'es'">
                <h1>Aviso Legal y Descargo de Responsabilidad</h1>

                <section>
                    <h3>1. Proyecto de Fans No Oficial</h3>
                    <p>
                        Esta aplicación es un proyecto comunitario <strong>no oficial</strong>. No existe ninguna
                        relación comercial con <strong>Embark Studios AB</strong>.
                        Este sitio no está patrocinado, avalado ni aprobado oficialmente por Embark Studios.
                    </p>
                </section>

                <section>
                    <h3>2. Propiedad Intelectual</h3>
                    <p>
                        <strong>ARC Raiders®</strong> es una marca registrada de Embark Studios AB.
                        Todo el contenido del juego, capturas de pantalla, iconos de objetos y logotipos son propiedad
                        intelectual de Embark Studios AB.
                        El uso de este material es únicamente con fines informativos y educativos (Uso Legítimo).
                    </p>
                </section>

                <section>
                    <h3>3. Fuentes de Datos</h3>
                    <p>
                        Toda la información proporcionada en este sitio web ha sido recopilada del propio juego y de
                        fuentes de la comunidad de acceso público.
                    </p>
                </section>

                <section>
                    <h3>4. Actualizaciones y Responsabilidad</h3>
                    <p>
                        Todos los datos se proporcionan sin garantía. Dado que el juego recibe actualizaciones
                        constantes (Live Service),
                        la información puede cambiar con nuevos parches.
                        No asumimos responsabilidad por decisiones tomadas en el juego basadas en esta herramienta.
                    </p>
                </section>
            </div>

            <div v-else>
                <h1>Legal Disclaimer</h1>

                <section>
                    <h3>1. Unofficial Fan Project</h3>
                    <p>
                        This application ("Loot Tracker") is an <strong>unofficial</strong> community-driven project.
                        It is not affiliated with, endorsed, sponsored, or specifically approved by <strong>Embark
                            Studios AB</strong>.
                    </p>
                </section>

                <section>
                    <h3>2. Intellectual Property (Embark Studios)</h3>
                    <p>
                        <strong>ARC Raiders®</strong> is a registered trademark of Embark Studios AB.
                        All game assets, screenshots, item icons, logos, and designs used herein are the intellectual
                        property of Embark Studios AB.
                    </p>
                    <p>
                        These assets are used on this website strictly for informational and educational purposes under
                        Fair Use principles.
                    </p>
                </section>

                <section>
                    <h3>3. Data Sources</h3>
                    <p>
                        All information provided on this website has been aggregated from the game itself and publicly
                        available community sources.
                    </p>
                </section>

                <section>
                    <h3>4. Liability & Updates</h3>
                    <p>
                        All data is provided "as is" without warranty. As this is a live service game, content and
                        values are subject to change
                        due to <strong>patches and updates</strong>.
                        We accept no liability for any in-game losses or decisions resulting from the use of this tool.
                    </p>
                </section>
            </div>

            <div class="back-link">
                <router-link to="/">
                    <span v-if="browserLang === 'de'">← Zurück zum Tracker</span>
                    <span v-else-if="browserLang === 'es'">← Volver al Rastreador</span>
                    <span v-else>← Back to Tracker</span>
                </router-link>
            </div>

        </div>
    </div>
</template>

<style scoped>
.disclaimer-page {
    padding: 60px 20px;
    background-color: #0e0e0e;
    color: #dcdcdc;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    line-height: 1.6;
}

.content-container {
    max-width: 800px;
    margin: 0 auto;
    background: rgba(30, 30, 30, 0.5);
    padding: 40px;
    border-radius: 12px;
    border: 1px solid #333;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

h1 {
    color: #e74c3c;
    font-size: 2rem;
    border-bottom: 2px solid #e74c3c;
    padding-bottom: 15px;
    margin-bottom: 40px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

section {
    margin-bottom: 40px;
}

h3 {
    color: #fff;
    font-size: 1.3rem;
    margin-bottom: 15px;
    border-left: 4px solid #7f8c8d;
    padding-left: 10px;
}

p {
    margin-bottom: 15px;
    color: #b0b0b0;
    font-size: 0.95rem;
}

strong {
    color: #ddd;
}

.back-link {
    margin-top: 60px;
    text-align: center;
    border-top: 1px solid #333;
    padding-top: 30px;
}

.back-link a {
    background: #2c3e50;
    color: white;
    padding: 12px 25px;
    border-radius: 6px;
    font-weight: 600;
    display: inline-block;
    text-decoration: none;
    transition: background 0.2s;
}

.back-link a:hover {
    background: #e74c3c;
}

/* Mobile Optimierung */
@media (max-width: 600px) {
    .content-container {
        padding: 20px;
    }

    h1 {
        font-size: 1.5rem;
    }
}
</style>