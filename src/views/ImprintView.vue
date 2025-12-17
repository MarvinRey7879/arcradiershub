<template>
    <div class="legal-page">
        <h1>Imprint (Impressum)</h1>
        <p>Information according to § 5 TMG</p>

        <h2>Operator</h2>
        <p>
            Marvin Mez<br>
            Zinhainerweg 6<br>
            50767 Köln
        </p>

        <h2>Contact</h2>
        <p>
            E-Mail: <a href="mailto:arcraidershubnet@gmail.com">arcraidershubnet@gmail.com</a>
        </p>

        <h2>Disclaimer</h2>
        <p>This is a fan-made tool for the game ARC Raiders. We are not affiliated with, endorsed, sponsored, or
            specifically approved by Embark Studios. All game content and assets are property of their respective
            owners.</p>

        <div class="back-link">
            <router-link to="/">← Back to Tool</router-link>
        </div>
    </div>
</template>

<style scoped>
/* Deine Styles, angepasst an Vue */
.legal-page {
    max-width: 800px;
    margin: 100px auto 40px auto;
    padding: 20px;
    color: #e0e0e0;
    font-family: sans-serif;
    line-height: 1.6;
}

h1,
h2 {
    color: #e74c3c;
    margin-top: 30px;
}

a {
    color: #e74c3c;
    text-decoration: none;
}

.back-link {
    margin-top: 40px;
}
</style>