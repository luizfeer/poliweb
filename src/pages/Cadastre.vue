<template>
  <div>
    <div>Carregando...</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      formUrl:'https://docs.google.com/forms/d/e/1FAIpQLScKmSsjlrUdGNJMJpsbwRGFFZIAHrt50Fe8-WDeus1fgMMHoA/viewform'
    }
  },
   created() {
    window.location.href = this.formUrl;
  },
};
</script>
