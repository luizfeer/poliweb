<template>
  <!-- Ícones de redes sociais (SVG inline - mais confiável) -->
  <svg v-if="socialIcon" xmlns="http://www.w3.org/2000/svg" :width="parseSize" :height="parseSize" viewBox="0 0 24 24" fill="currentColor" stroke="none" :class="$attrs.class">
    <path v-if="socialIcon === 'whatsapp'" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    <path v-else-if="socialIcon === 'facebook'" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    <path v-else-if="socialIcon === 'instagram'" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948 2.37 4.761 6.227 7.752 11.048 7.979C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.761-.2 7.752-2.618 7.979-11.048.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.352-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
  <component
    v-else-if="iconComponent"
    :is="iconComponent"
    :size="parseSize"
    :stroke-width="strokeWidth"
    :class="[$attrs.class]"
    v-bind="$attrs"
  />
  <q-icon v-else :name="name" :size="parseSize + 'px'" v-bind="$attrs" />
</template>

<script>
import {
  Menu,
  Share2,
  MapPin,
  ChevronDown,
  ChevronRight,
  X,
  CameraPlus,
  CloudUpload,
  ImagePlus,
  Phone,
  Globe,
  Mail,
  ExternalLink,
  Link2,
  Edit,
  Trash2,
  CheckCircle,
  CirclePlus,
  Search,
  Store,
  ArrowRight,
  Download,
  Navigation,
  Play,
  Pause,
  Plus,
  ShoppingCart,
  ArrowLeft,
  Minus,
  User,
  FileUp,
  Lock,
  Home,
  Users,
  Smile,
  Info,
  LayoutGrid,
  List,
  LayoutList,
  Maximize2,
  Video,
  VideoOff,
  MessageCircle
} from 'lucide-vue-next'

// Ícones de marca (SVG inline - Lucide não tem brands)
const iconMap = {
  menu: Menu,
  share: Share2,
  'share-2': Share2,
  place: MapPin,
  'map-pin': MapPin,
  'location-on': MapPin,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'arrow-drop-down': ChevronDown,
  close: X,
  clear: X,
  remove: Minus,
  'add-a-photo': CameraPlus,
  'camera-plus': CameraPlus,
  'cloud-upload': CloudUpload,
  'add-photo-alternate': ImagePlus,
  'image-plus': ImagePlus,
  phone: Phone,
  language: Globe,
  globe: Globe,
  email: Mail,
  mail: Mail,
  'open-in-new': ExternalLink,
  'external-link': ExternalLink,
  link: Link2,
  'link-2': Link2,
  edit: Edit,
  delete: Trash2,
  trash: Trash2,
  'check-circle': CheckCircle,
  'circle-plus': CirclePlus,
  'add-circle-outline': CirclePlus,
  search: Search,
  storefront: Store,
  store: Store,
  'arrow-forward': ArrowRight,
  'arrow-right': ArrowRight,
  'file-download': Download,
  download: Download,
  'gps-fixed': Navigation,
  navigation: Navigation,
  play: Play,
  pause: Pause,
  add: Plus,
  'shopping-cart': ShoppingCart,
  'shopping-basket': ShoppingCart,
  'arrow-back': ArrowLeft,
  'arrow-left': ArrowLeft,
  minimize: Minus,
  minus: Minus,
  user: User,
  'perm-identity': User,
  home: Home,
  'location-city': MapPin,
  'account-circle': User,
  'alternate_email': Mail,
  'alternate-email': Mail,
  business: Store,
  group: Users,
  'insert-emoticon': Smile,
  'insert_emoticon': Smile,
  info: Info,
  'file-upload': FileUp,
  'file-up': FileUp,
  'add-shopping-cart': ShoppingCart,
  'add-circle': Plus,
  'play-circle-filled': Play,
  'play-arrow': Play,
  'play_arrow': Play,
  'create': Edit,
  'ion-create': Edit,
  lock: Lock,
  'layout-grid': LayoutGrid,
  'layout-grid-2': LayoutGrid,
  list: List,
  'list-ul': List,
  'layout-list': LayoutList,
  'maximize': Maximize2,
  'crop_square': Maximize2,
  'videocam': Video,
  'video': Video,
  'videocam-off': VideoOff,
  'video-off': VideoOff,
  chat: MessageCircle
}

export default {
  name: 'AppIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [Number, String],
      default: 24
    },
    strokeWidth: {
      type: Number,
      default: 2
    }
  },
  computed: {
    parseSize() {
      const s = this.size
      if (typeof s === 'number') return s
      if (typeof s === 'string' && s.match(/^\d+$/)) return parseInt(s, 10)
      if (typeof s === 'string' && s.endsWith('px')) return parseInt(s, 10)
      return 24
    },
    socialIcon() {
      const n = (this.name || '').toLowerCase()
      if (n.includes('whatsapp')) return 'whatsapp'
      if (n.includes('facebook')) return 'facebook'
      if (n.includes('instagram')) return 'instagram'
      return null
    },
    iconComponent() {
      const name = (this.name || '').toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-').replace(/^fab-fa-|^fab\s+fa-/g, '')
      const mapped = iconMap[name] || iconMap[name.replace('fab-fa-', '')]
      if (mapped) return mapped
      return null
    }
  },
}
</script>
