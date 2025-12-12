<script setup>
import LootTracker from './components/LootTracker.vue'
</script>

<template>
  <main>
    <LootTracker />
  </main>
</template>

<style>
/* Globaler Reset für Dark Mode */
body {
  margin: 0;
  padding: 0;
  background-color: #121212;
  color: white;
  font-family: 'Inter', sans-serif;
}

.main-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #333;
  margin-bottom: 20px;
  background: #181818;
}

#app {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  display: block;
  /* Manchmal ist es grid, das kann stören */
}

main,
header.main-header {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.main-header h1 {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #e74c3c;
  /* ARC Raiders Red Style */
}
</style>