<template>
  <q-page class="bg-gray-100">
    <div class="q-pa-md" style="max-width: 500px">
      <div class="text-h6 q-mb-md">Criar cidade</div>

      <q-form @submit="searchCoordinates" class="q-gutter-md">
        <div class="row q-col-gutter-md">
          <q-input
            class="col"
            filled
            v-model="city"
            label="Cidade"
            :rules="[(v) => !!v || 'Obrigatório']"
          />
          <q-input
            class="col"
            filled
            v-model="state"
            label="UF"
            maxlength="2"
            :rules="[(v) => !!v || 'Obrigatório']"
          />
        </div>
        <q-btn
          label="Buscar coordenadas"
          type="submit"
          color="primary"
          :loading="searching"
        />
      </q-form>

      <template v-if="coordinates">
        <q-separator class="q-my-md" />

        <q-form @submit="createCity" class="q-gutter-md">
          <div class="text-caption text-grey-8">{{ foundDisplayName }}</div>

          <q-input
            filled
            v-model="country"
            label="País"
            :rules="[(v) => !!v || 'Obrigatório']"
          />

          <q-input
            filled
            v-model="zipCode"
            label="CEP"
            mask="#####-###"
            unmasked-value
            hint="Deve ter 8 dígitos e terminar em 000"
            :rules="[
              (v) => /^\d{8}$/.test(v) || 'CEP deve ter 8 dígitos',
              (v) => v.endsWith('000') || 'CEP deve terminar em 000'
            ]"
          />

          <div class="row q-col-gutter-md">
            <q-input
              class="col"
              filled
              v-model.number="coordinates.lat"
              type="number"
              label="Latitude"
            />
            <q-input
              class="col"
              filled
              v-model.number="coordinates.long"
              type="number"
              label="Longitude"
            />
          </div>

          <q-btn
            label="Criar cidade"
            type="submit"
            color="positive"
            :loading="creating"
          />
        </q-form>
      </template>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import axios from 'axios'

export default defineComponent({
  name: 'AddAddress',
  data () {
    return {
      city: '',
      state: '',
      country: 'Brasil',
      zipCode: '',
      coordinates: null,
      foundDisplayName: '',
      searching: false,
      creating: false
    }
  },
  methods: {
    async searchCoordinates () {
      this.searching = true
      try {
        const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            format: 'json',
            q: `${this.city}, ${this.state}, Brasil`,
            countrycodes: 'br',
            limit: 1
          }
        })

        if (!data || !data.length) {
          this.$q.notify({ color: 'negative', message: 'Cidade não encontrada' })
          this.coordinates = null
          return
        }

        this.coordinates = { lat: Number(data[0].lat), long: Number(data[0].lon) }
        this.foundDisplayName = data[0].display_name
      } catch (error) {
        this.$q.notify({ color: 'negative', message: 'Erro ao buscar coordenadas' })
      } finally {
        this.searching = false
      }
    },
    async createCity () {
      this.creating = true
      try {
        await this.$api.post('/address', {
          zipCode: this.zipCode,
          city: this.city,
          state: this.state,
          country: this.country,
          coordinates: {
            lat: this.coordinates.lat,
            long: this.coordinates.long
          }
        })

        this.$q.notify({ color: 'positive', message: 'Cidade criada com sucesso!' })
        this.resetForm()
      } catch (error) {
        const msg = error.response?.data?.message || 'Erro ao criar cidade'
        this.$q.notify({ color: 'negative', message: msg, icon: 'report_problem' })
      } finally {
        this.creating = false
      }
    },
    resetForm () {
      this.city = ''
      this.state = ''
      this.zipCode = ''
      this.coordinates = null
      this.foundDisplayName = ''
    }
  }
})
</script>
