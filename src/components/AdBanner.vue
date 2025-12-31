<script setup>
import { onMounted } from 'vue';

onMounted(() => {
    try {
        // Versucht, die Werbung zu laden
        (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
        console.error('AdSense Fehler:', e);
    }
});
</script>

<template>
    <div class="ad-container">
        <div class="ad-label">Anzeige</div>
        <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true"></ins>
    </div>
</template>

<style scoped>
.ad-container {
    margin: 20px 0;
    text-align: center;
    min-height: 100px;
    background: rgba(255, 255, 255, 0.05);
}

.ad-label {
    font-size: 10px;
    color: #666;
}
</style>