export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accommodations: {
        Row: {
          address: string | null
          airbnb_url: string | null
          amenities: Json | null
          attributes: Json
          booking_url: string | null
          cep: string | null
          city_id: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          district_id: string | null
          email: string | null
          featured: boolean | null
          featured_until: string | null
          has_marina: boolean | null
          id: string
          instagram: string | null
          lat: number | null
          lng: number | null
          max_guests: number | null
          name: string
          near_lake: boolean | null
          og_image_url: string | null
          og_square_image_url: string | null
          owner_profile_id: string | null
          phone: string | null
          photos: Json | null
          plan: string | null
          price_max: number | null
          price_min: number | null
          published_at: string | null
          rating: number | null
          rooms_count: number | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"] | null
          type: Database["public"]["Enums"]["accommodation_kind"] | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          airbnb_url?: string | null
          amenities?: Json | null
          attributes?: Json
          booking_url?: string | null
          cep?: string | null
          city_id: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          email?: string | null
          featured?: boolean | null
          featured_until?: string | null
          has_marina?: boolean | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          name: string
          near_lake?: boolean | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          photos?: Json | null
          plan?: string | null
          price_max?: number | null
          price_min?: number | null
          published_at?: string | null
          rating?: number | null
          rooms_count?: number | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          type?: Database["public"]["Enums"]["accommodation_kind"] | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          airbnb_url?: string | null
          amenities?: Json | null
          attributes?: Json
          booking_url?: string | null
          cep?: string | null
          city_id?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          email?: string | null
          featured?: boolean | null
          featured_until?: string | null
          has_marina?: boolean | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          name?: string
          near_lake?: boolean | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          photos?: Json | null
          plan?: string | null
          price_max?: number | null
          price_min?: number | null
          published_at?: string | null
          rating?: number | null
          rooms_count?: number | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          type?: Database["public"]["Enums"]["accommodation_kind"] | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodations_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      account_deletion_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          profile_id: string
          reason: string | null
          requested_at: string
          requested_email: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["account_deletion_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          profile_id: string
          reason?: string | null
          requested_at?: string
          requested_email?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["account_deletion_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          reason?: string | null
          requested_at?: string
          requested_email?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["account_deletion_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_deletion_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_slots: {
        Row: {
          active: boolean | null
          city_id: string | null
          created_at: string | null
          description: string | null
          height: number | null
          id: string
          key: string
          width: number | null
        }
        Insert: {
          active?: boolean | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string
          key: string
          width?: number | null
        }
        Update: {
          active?: boolean | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string
          key?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_slots_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          active: boolean | null
          advertiser_business_id: string | null
          advertiser_realtor_id: string | null
          city_id: string
          clicks: number | null
          created_at: string | null
          end_at: string | null
          id: string
          image_url: string
          impressions: number | null
          slot_id: string
          start_at: string | null
          target_url: string
          title: string | null
        }
        Insert: {
          active?: boolean | null
          advertiser_business_id?: string | null
          advertiser_realtor_id?: string | null
          city_id: string
          clicks?: number | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          image_url: string
          impressions?: number | null
          slot_id: string
          start_at?: string | null
          target_url: string
          title?: string | null
        }
        Update: {
          active?: boolean | null
          advertiser_business_id?: string | null
          advertiser_realtor_id?: string | null
          city_id?: string
          clicks?: number | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          image_url?: string
          impressions?: number | null
          slot_id?: string
          start_at?: string | null
          target_url?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_advertiser_business_id_fkey"
            columns: ["advertiser_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertisements_advertiser_business_id_fkey"
            columns: ["advertiser_business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertisements_advertiser_realtor_id_fkey"
            columns: ["advertiser_realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertisements_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertisements_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_jobs: {
        Row: {
          city_id: string | null
          cost_usd: number | null
          created_at: string | null
          error: string | null
          finished_at: string | null
          id: string
          input_ref: Json | null
          job_type: string
          model: string | null
          output_ref: Json | null
          started_at: string | null
          status: string | null
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          city_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          input_ref?: Json | null
          job_type: string
          model?: string | null
          output_ref?: Json | null
          started_at?: string | null
          status?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          city_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          input_ref?: Json | null
          job_type?: string
          model?: string | null
          output_ref?: Json | null
          started_at?: string | null
          status?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          city_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_name: string
          id: string
          metadata: Json
          path: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_name: string
          id?: string
          metadata?: Json
          path: string
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_name?: string
          id?: string
          metadata?: Json
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      app_secrets: {
        Row: {
          ciphertext: string
          city_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          key_version: number
          nonce: string
          rotated_at: string | null
          rotated_by: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          ciphertext: string
          city_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          key_version?: number
          nonce: string
          rotated_at?: string | null
          rotated_by?: string | null
          scope?: string
          updated_at?: string
        }
        Update: {
          ciphertext?: string
          city_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          key_version?: number
          nonce?: string
          rotated_at?: string | null
          rotated_by?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_secrets_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      art_pieces: {
        Row: {
          business_id: string
          city_id: string
          created_at: string
          created_by: string | null
          document: Json
          format: string
          id: string
          name: string
          ramo: string
          updated_at: string
        }
        Insert: {
          business_id: string
          city_id: string
          created_at?: string
          created_by?: string | null
          document?: Json
          format?: string
          id?: string
          name?: string
          ramo?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          city_id?: string
          created_at?: string
          created_by?: string | null
          document?: Json
          format?: string
          id?: string
          name?: string
          ramo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "art_pieces_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "art_pieces_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "art_pieces_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "art_pieces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_webhook_events: {
        Row: {
          customer_id: string | null
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          payload: Json
          payment_id: string | null
          portal_payment_id: string | null
          processed: boolean
          processed_at: string | null
          received_at: string
          subscription_id: string | null
        }
        Insert: {
          customer_id?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          payload: Json
          payment_id?: string | null
          portal_payment_id?: string | null
          processed?: boolean
          processed_at?: string | null
          received_at?: string
          subscription_id?: string | null
        }
        Update: {
          customer_id?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          portal_payment_id?: string | null
          processed?: boolean
          processed_at?: string | null
          received_at?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_webhook_events_portal_payment_id_fkey"
            columns: ["portal_payment_id"]
            isOneToOne: false
            referencedRelation: "portal_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      attraction_photos: {
        Row: {
          attraction_id: string
          author_profile_id: string
          caption: string | null
          city_id: string
          created_at: string | null
          id: string
          media_type: string
          moderated_at: string | null
          moderated_by: string | null
          status: Database["public"]["Enums"]["entity_status"] | null
          storage_path: string
          updated_at: string | null
        }
        Insert: {
          attraction_id: string
          author_profile_id: string
          caption?: string | null
          city_id: string
          created_at?: string | null
          id?: string
          media_type?: string
          moderated_at?: string | null
          moderated_by?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          storage_path: string
          updated_at?: string | null
        }
        Update: {
          attraction_id?: string
          author_profile_id?: string
          caption?: string | null
          city_id?: string
          created_at?: string | null
          id?: string
          media_type?: string
          moderated_at?: string | null
          moderated_by?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          storage_path?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attraction_photos_attraction_id_fkey"
            columns: ["attraction_id"]
            isOneToOne: false
            referencedRelation: "attractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attraction_photos_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attraction_photos_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attraction_photos_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attraction_reviews: {
        Row: {
          attraction_id: string
          author_profile_id: string
          city_id: string
          comment: string | null
          created_at: string | null
          id: string
          photo_url: string | null
          rating: number
          reply_at: string | null
          reply_owner: string | null
          status: Database["public"]["Enums"]["entity_status"] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          attraction_id: string
          author_profile_id: string
          city_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          rating: number
          reply_at?: string | null
          reply_owner?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          attraction_id?: string
          author_profile_id?: string
          city_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          rating?: number
          reply_at?: string | null
          reply_owner?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attraction_reviews_attraction_id_fkey"
            columns: ["attraction_id"]
            isOneToOne: false
            referencedRelation: "attractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attraction_reviews_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attraction_reviews_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      attraction_services: {
        Row: {
          attraction_id: string
          contact_business_id: string | null
          created_at: string | null
          details: string | null
          id: string
          kind: string
          label: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          attraction_id: string
          contact_business_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          kind: string
          label: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          attraction_id?: string
          contact_business_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          kind?: string
          label?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attraction_services_attraction_id_fkey"
            columns: ["attraction_id"]
            isOneToOne: false
            referencedRelation: "attractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attraction_services_contact_business_id_fkey"
            columns: ["contact_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attraction_services_contact_business_id_fkey"
            columns: ["contact_business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
        ]
      }
      attractions: {
        Row: {
          accessibility: Json | null
          address: string | null
          amenities: Json | null
          attributes: Json
          best_season: string | null
          city_id: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          entry_fee: string | null
          family_friendly: boolean | null
          featured: boolean | null
          google_maps_url: string | null
          google_photos: Json | null
          google_place_id: string | null
          google_summary: string | null
          google_summary_at: string | null
          hours_legacy_text: string | null
          id: string
          instagram: string | null
          last_google_sync_at: string | null
          lat: number | null
          lng: number | null
          name: string
          og_image_url: string | null
          og_square_image_url: string | null
          owner_profile_id: string | null
          pet_friendly: boolean | null
          phone: string | null
          photos: Json | null
          price_range: string | null
          rating: number | null
          reviews_count: number | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"] | null
          street_view_url: string | null
          tips: string | null
          type: Database["public"]["Enums"]["attraction_kind"] | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          accessibility?: Json | null
          address?: string | null
          amenities?: Json | null
          attributes?: Json
          best_season?: string | null
          city_id: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          entry_fee?: string | null
          family_friendly?: boolean | null
          featured?: boolean | null
          google_maps_url?: string | null
          google_photos?: Json | null
          google_place_id?: string | null
          google_summary?: string | null
          google_summary_at?: string | null
          hours_legacy_text?: string | null
          id?: string
          instagram?: string | null
          last_google_sync_at?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          pet_friendly?: boolean | null
          phone?: string | null
          photos?: Json | null
          price_range?: string | null
          rating?: number | null
          reviews_count?: number | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          street_view_url?: string | null
          tips?: string | null
          type?: Database["public"]["Enums"]["attraction_kind"] | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          accessibility?: Json | null
          address?: string | null
          amenities?: Json | null
          attributes?: Json
          best_season?: string | null
          city_id?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          entry_fee?: string | null
          family_friendly?: boolean | null
          featured?: boolean | null
          google_maps_url?: string | null
          google_photos?: Json | null
          google_place_id?: string | null
          google_summary?: string | null
          google_summary_at?: string | null
          hours_legacy_text?: string | null
          id?: string
          instagram?: string | null
          last_google_sync_at?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          pet_friendly?: boolean | null
          phone?: string | null
          photos?: Json | null
          price_range?: string | null
          rating?: number | null
          reviews_count?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          street_view_url?: string | null
          tips?: string | null
          type?: Database["public"]["Enums"]["attraction_kind"] | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attractions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attractions_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          city_id: string | null
          created_at: string | null
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          city_id?: string | null
          created_at?: string | null
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          city_id?: string | null
          created_at?: string | null
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      business_catalogs: {
        Row: {
          active: boolean
          business_id: string
          catalog_type: string
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          business_id: string
          catalog_type?: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          business_id?: string
          catalog_type?: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_catalogs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_catalogs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          active: boolean | null
          city_id: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          active?: boolean | null
          city_id?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          active?: boolean | null
          city_id?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_categories_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_category_assignments: {
        Row: {
          business_id: string
          category_id: string
          created_at: string | null
          is_primary: boolean | null
        }
        Insert: {
          business_id: string
          category_id: string
          created_at?: string | null
          is_primary?: boolean | null
        }
        Update: {
          business_id?: string
          category_id?: string
          created_at?: string | null
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "business_category_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_category_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_claims: {
        Row: {
          business_id: string
          created_at: string | null
          evidence_text: string | null
          evidence_url: string | null
          id: string
          profile_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          profile_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          profile_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_daily_stats: {
        Row: {
          business_id: string
          city_id: string
          date: string
          map_clicks: number
          phone_clicks: number
          total_events: number
          views: number
          website_clicks: number
          whatsapp_clicks: number
        }
        Insert: {
          business_id: string
          city_id: string
          date: string
          map_clicks?: number
          phone_clicks?: number
          total_events?: number
          views?: number
          website_clicks?: number
          whatsapp_clicks?: number
        }
        Update: {
          business_id?: string
          city_id?: string
          date?: string
          map_clicks?: number
          phone_clicks?: number
          total_events?: number
          views?: number
          website_clicks?: number
          whatsapp_clicks?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_daily_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_daily_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_daily_stats_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      business_delivery_status: {
        Row: {
          auto_offline_at: string | null
          business_id: string
          busy_mode: boolean
          is_online: boolean
          last_changed_by: string | null
          online_since: string | null
          pause_reason: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          auto_offline_at?: string | null
          business_id: string
          busy_mode?: boolean
          is_online?: boolean
          last_changed_by?: string | null
          online_since?: string | null
          pause_reason?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_offline_at?: string | null
          business_id?: string
          busy_mode?: boolean
          is_online?: boolean
          last_changed_by?: string | null
          online_since?: string | null
          pause_reason?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_delivery_status_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_delivery_status_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_delivery_status_last_changed_by_fkey"
            columns: ["last_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_favorites: {
        Row: {
          business_id: string
          created_at: string | null
          profile_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          profile_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_leads: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          asaas_customer_id: string | null
          asaas_next_due_date: string | null
          asaas_payment_link: string | null
          asaas_subscription_id: string | null
          asaas_subscription_status: string | null
          business_id: string | null
          business_name: string
          category_hint: string | null
          city_id: string
          consent: boolean
          contact_name: string
          created_at: string
          document: string | null
          email: string
          free_forever: boolean
          free_reason: string | null
          id: string
          instagram: string | null
          message: string | null
          notes: string | null
          nudge_d2_sent_at: string | null
          nudge_d7_sent_at: string | null
          overdue_unpublished_at: string | null
          phone: string
          plan_slug: string | null
          profile_id: string
          rejected_reason: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          asaas_customer_id?: string | null
          asaas_next_due_date?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          asaas_subscription_status?: string | null
          business_id?: string | null
          business_name: string
          category_hint?: string | null
          city_id: string
          consent?: boolean
          contact_name: string
          created_at?: string
          document?: string | null
          email: string
          free_forever?: boolean
          free_reason?: string | null
          id?: string
          instagram?: string | null
          message?: string | null
          notes?: string | null
          nudge_d2_sent_at?: string | null
          nudge_d7_sent_at?: string | null
          overdue_unpublished_at?: string | null
          phone: string
          plan_slug?: string | null
          profile_id: string
          rejected_reason?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          asaas_customer_id?: string | null
          asaas_next_due_date?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          asaas_subscription_status?: string | null
          business_id?: string | null
          business_name?: string
          category_hint?: string | null
          city_id?: string
          consent?: boolean
          contact_name?: string
          created_at?: string
          document?: string | null
          email?: string
          free_forever?: boolean
          free_reason?: string | null
          id?: string
          instagram?: string | null
          message?: string | null
          notes?: string | null
          nudge_d2_sent_at?: string | null
          nudge_d7_sent_at?: string | null
          overdue_unpublished_at?: string | null
          phone?: string
          plan_slug?: string | null
          profile_id?: string
          rejected_reason?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_leads_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_leads_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_leads_plan_slug_fkey"
            columns: ["plan_slug"]
            isOneToOne: false
            referencedRelation: "business_plans"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "business_leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_menu_items: {
        Row: {
          available: boolean
          business_id: string
          city_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          photo_url: string | null
          position: number
          price_cents: number
          section_id: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          business_id: string
          city_id: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          position?: number
          price_cents?: number
          section_id: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          business_id?: string
          city_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          position?: number
          price_cents?: number
          section_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_menu_items_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_menu_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "business_menu_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      business_menu_sections: {
        Row: {
          business_id: string
          city_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          business_id: string
          city_id: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          city_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_menu_sections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_menu_sections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_menu_sections_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      business_monthly_reports: {
        Row: {
          ai_job_id: string | null
          ai_summary: string | null
          business_id: string
          category_rank: number | null
          category_size: number | null
          category_slug: string | null
          city_id: string
          created_at: string
          id: string
          metrics: Json
          month: string
          updated_at: string
        }
        Insert: {
          ai_job_id?: string | null
          ai_summary?: string | null
          business_id: string
          category_rank?: number | null
          category_size?: number | null
          category_slug?: string | null
          city_id: string
          created_at?: string
          id?: string
          metrics?: Json
          month: string
          updated_at?: string
        }
        Update: {
          ai_job_id?: string | null
          ai_summary?: string | null
          business_id?: string
          category_rank?: number | null
          category_size?: number | null
          category_slug?: string | null
          city_id?: string
          created_at?: string
          id?: string
          metrics?: Json
          month?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_monthly_reports_ai_job_id_fkey"
            columns: ["ai_job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_monthly_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_monthly_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_monthly_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      business_page_events: {
        Row: {
          business_id: string
          city_id: string
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string
          referrer: string | null
          session_hash: string
          session_id: string | null
          source: string | null
        }
        Insert: {
          business_id: string
          city_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          referrer?: string | null
          session_hash: string
          session_id?: string | null
          source?: string | null
        }
        Update: {
          business_id?: string
          city_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          referrer?: string | null
          session_hash?: string
          session_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_page_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_page_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_page_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      business_plans: {
        Row: {
          created_at: string
          description: string
          display_order: number
          features: Json
          highlight: boolean
          monthly_value_cents: number
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          features?: Json
          highlight?: boolean
          monthly_value_cents: number
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          features?: Json
          highlight?: boolean
          monthly_value_cents?: number
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_promotions: {
        Row: {
          active: boolean | null
          business_id: string
          coupon_code: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          id: string
          title: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean | null
          business_id: string
          coupon_code?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          title: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          coupon_code?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          title?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reports: {
        Row: {
          business_id: string
          city_id: string
          created_at: string | null
          id: string
          notes: string | null
          reason: string
          reporter_profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          business_id: string
          city_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason: string
          reporter_profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          city_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason?: string
          reporter_profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          author_profile_id: string
          business_id: string
          comment: string | null
          created_at: string | null
          id: string
          photo_url: string | null
          rating: number
          reply_at: string | null
          reply_owner: string | null
          status: Database["public"]["Enums"]["entity_status"] | null
          title: string | null
        }
        Insert: {
          author_profile_id: string
          business_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          rating: number
          reply_at?: string | null
          reply_owner?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          title?: string | null
        }
        Update: {
          author_profile_id?: string
          business_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          rating?: number
          reply_at?: string | null
          reply_owner?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
        ]
      }
      business_wa_operators: {
        Row: {
          active: boolean
          business_id: string
          created_at: string | null
          display_name: string | null
          id: string
          phone_number: string
          role: string
          verified_at: string | null
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string | null
          display_name?: string | null
          id?: string
          phone_number: string
          role?: string
          verified_at?: string | null
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string | null
          display_name?: string | null
          id?: string
          phone_number?: string
          role?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_wa_operators_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_wa_operators_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
        ]
      }
      business_weekly_rank: {
        Row: {
          business_id: string
          category_slug: string | null
          city_id: string
          district_id: string | null
          rank: number
          score: number
          week_start: string
        }
        Insert: {
          business_id: string
          category_slug?: string | null
          city_id: string
          district_id?: string | null
          rank: number
          score?: number
          week_start: string
        }
        Update: {
          business_id?: string
          category_slug?: string | null
          city_id?: string
          district_id?: string | null
          rank?: number
          score?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_weekly_rank_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_weekly_rank_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_weekly_rank_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_weekly_rank_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          accepts_card_on_delivery: boolean
          address: string | null
          amenities: Json | null
          attributes: Json
          catalog_type: string | null
          cep: string | null
          city_id: string
          claimed: boolean | null
          cnpj: string | null
          cover_url: string | null
          created_at: string | null
          delivery_asaas_customer_id: string | null
          delivery_asaas_subscription_id: string | null
          delivery_enabled: boolean
          delivery_fee: number | null
          delivery_hours: Json
          delivery_min_order: number | null
          delivery_plan: string
          delivery_plan_current_period_end: string | null
          delivery_radius_km: number | null
          delivery_subscription_status: string | null
          delivery_time_min: number | null
          delivery_trial_ends_at: string | null
          delivery_trial_started_at: string | null
          delivery_zones: Json
          description: string | null
          district_id: string | null
          email: string | null
          facebook: string | null
          featured: boolean | null
          google_maps_url: string | null
          hours: Json | null
          id: string
          import_source: Json | null
          instagram: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          og_image_url: string | null
          og_square_image_url: string | null
          order_instructions: string | null
          ordering_enabled: boolean
          owner_profile_id: string | null
          payment_methods: Json | null
          phone: string | null
          photos: Json | null
          pickup_enabled: boolean
          pickup_time_min: number | null
          pix_key: string | null
          plan: string | null
          published_at: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"] | null
          table_service_enabled: boolean
          updated_at: string | null
          verified: boolean | null
          views_count: number | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          accepts_card_on_delivery?: boolean
          address?: string | null
          amenities?: Json | null
          attributes?: Json
          catalog_type?: string | null
          cep?: string | null
          city_id: string
          claimed?: boolean | null
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string | null
          delivery_asaas_customer_id?: string | null
          delivery_asaas_subscription_id?: string | null
          delivery_enabled?: boolean
          delivery_fee?: number | null
          delivery_hours?: Json
          delivery_min_order?: number | null
          delivery_plan?: string
          delivery_plan_current_period_end?: string | null
          delivery_radius_km?: number | null
          delivery_subscription_status?: string | null
          delivery_time_min?: number | null
          delivery_trial_ends_at?: string | null
          delivery_trial_started_at?: string | null
          delivery_zones?: Json
          description?: string | null
          district_id?: string | null
          email?: string | null
          facebook?: string | null
          featured?: boolean | null
          google_maps_url?: string | null
          hours?: Json | null
          id?: string
          import_source?: Json | null
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          order_instructions?: string | null
          ordering_enabled?: boolean
          owner_profile_id?: string | null
          payment_methods?: Json | null
          phone?: string | null
          photos?: Json | null
          pickup_enabled?: boolean
          pickup_time_min?: number | null
          pix_key?: string | null
          plan?: string | null
          published_at?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          table_service_enabled?: boolean
          updated_at?: string | null
          verified?: boolean | null
          views_count?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          accepts_card_on_delivery?: boolean
          address?: string | null
          amenities?: Json | null
          attributes?: Json
          catalog_type?: string | null
          cep?: string | null
          city_id?: string
          claimed?: boolean | null
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string | null
          delivery_asaas_customer_id?: string | null
          delivery_asaas_subscription_id?: string | null
          delivery_enabled?: boolean
          delivery_fee?: number | null
          delivery_hours?: Json
          delivery_min_order?: number | null
          delivery_plan?: string
          delivery_plan_current_period_end?: string | null
          delivery_radius_km?: number | null
          delivery_subscription_status?: string | null
          delivery_time_min?: number | null
          delivery_trial_ends_at?: string | null
          delivery_trial_started_at?: string | null
          delivery_zones?: Json
          description?: string | null
          district_id?: string | null
          email?: string | null
          facebook?: string | null
          featured?: boolean | null
          google_maps_url?: string | null
          hours?: Json | null
          id?: string
          import_source?: Json | null
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          order_instructions?: string | null
          ordering_enabled?: boolean
          owner_profile_id?: string | null
          payment_methods?: Json | null
          phone?: string | null
          photos?: Json | null
          pickup_enabled?: boolean
          pickup_time_min?: number | null
          pix_key?: string | null
          plan?: string | null
          published_at?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          table_service_enabled?: boolean
          updated_at?: string | null
          verified?: boolean | null
          views_count?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_option_groups: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          item_id: string
          max_choices: number
          min_choices: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          item_id: string
          max_choices?: number
          min_choices?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          item_id?: string
          max_choices?: number
          min_choices?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_option_groups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_option_values: {
        Row: {
          available: boolean
          created_at: string | null
          display_order: number
          group_id: string
          id: string
          name: string
          price_add: number
        }
        Insert: {
          available?: boolean
          created_at?: string | null
          display_order?: number
          group_id: string
          id?: string
          name: string
          price_add?: number
        }
        Update: {
          available?: boolean
          created_at?: string | null
          display_order?: number
          group_id?: string
          id?: string
          name?: string
          price_add?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_option_values_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "catalog_item_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          available: boolean
          business_id: string
          calories: number | null
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          name: string
          photo_url: string | null
          prep_time_min: number | null
          price: number
          promo_valid_until: string | null
          promotional_price: number | null
          section_id: string
          serves: string | null
          sku: string | null
          stock_qty: number | null
          tags: string[]
          updated_at: string | null
        }
        Insert: {
          available?: boolean
          business_id: string
          calories?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          name: string
          photo_url?: string | null
          prep_time_min?: number | null
          price: number
          promo_valid_until?: string | null
          promotional_price?: number | null
          section_id: string
          serves?: string | null
          sku?: string | null
          stock_qty?: number | null
          tags?: string[]
          updated_at?: string | null
        }
        Update: {
          available?: boolean
          business_id?: string
          calories?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          photo_url?: string | null
          prep_time_min?: number | null
          price?: number
          promo_valid_until?: string | null
          promotional_price?: number | null
          section_id?: string
          serves?: string | null
          sku?: string | null
          stock_qty?: number | null
          tags?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "catalog_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_sections: {
        Row: {
          active: boolean
          catalog_id: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          catalog_id: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          catalog_id?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_sections_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "business_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_feedback: {
        Row: {
          channel: string | null
          city_id: string
          comment: string | null
          conversation: Json | null
          created_at: string
          id: string
          intent: string | null
          model: string | null
          page_context: string | null
          profile_id: string | null
          query: string
          rating: string
          response_blocks: Json | null
          response_text: string | null
          session_local_id: string | null
        }
        Insert: {
          channel?: string | null
          city_id: string
          comment?: string | null
          conversation?: Json | null
          created_at?: string
          id?: string
          intent?: string | null
          model?: string | null
          page_context?: string | null
          profile_id?: string | null
          query: string
          rating: string
          response_blocks?: Json | null
          response_text?: string | null
          session_local_id?: string | null
        }
        Update: {
          channel?: string | null
          city_id?: string
          comment?: string | null
          conversation?: Json | null
          created_at?: string
          id?: string
          intent?: string | null
          model?: string | null
          page_context?: string | null
          profile_id?: string | null
          query?: string
          rating?: string
          response_blocks?: Json | null
          response_text?: string | null
          session_local_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_feedback_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_claims: {
        Row: {
          church_id: string
          contact_whatsapp: string | null
          created_at: string | null
          evidence_text: string | null
          evidence_url: string | null
          id: string
          profile_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          church_id: string
          contact_whatsapp?: string | null
          created_at?: string | null
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          profile_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          church_id?: string
          contact_whatsapp?: string | null
          created_at?: string | null
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          profile_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_claims_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_reviews: {
        Row: {
          author_profile_id: string
          church_id: string
          city_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reply_at: string | null
          reply_owner: string | null
          status: Database["public"]["Enums"]["entity_status"] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author_profile_id: string
          church_id: string
          city_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reply_at?: string | null
          reply_owner?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_profile_id?: string
          church_id?: string
          city_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reply_at?: string | null
          reply_owner?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_reviews_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_reviews_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_reviews_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      church_schedule_items: {
        Row: {
          active: boolean
          church_id: string
          city_id: string
          created_at: string | null
          ends_at: string | null
          id: string
          note: string | null
          source_status: string
          starts_at: string
          title: string
          updated_at: string | null
          weekday: number
        }
        Insert: {
          active?: boolean
          church_id: string
          city_id: string
          created_at?: string | null
          ends_at?: string | null
          id?: string
          note?: string | null
          source_status?: string
          starts_at: string
          title: string
          updated_at?: string | null
          weekday: number
        }
        Update: {
          active?: boolean
          church_id?: string
          city_id?: string
          created_at?: string | null
          ends_at?: string | null
          id?: string
          note?: string | null
          source_status?: string
          starts_at?: string
          title?: string
          updated_at?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "church_schedule_items_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_schedule_items_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          address: string | null
          city_id: string
          claimed: boolean
          cover_url: string | null
          created_at: string | null
          description: string | null
          district_id: string | null
          email: string | null
          featured: boolean
          google_maps_url: string | null
          id: string
          import_source: Json | null
          instagram: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          og_image_url: string | null
          og_square_image_url: string | null
          owner_profile_id: string | null
          pastor_name: string | null
          phone: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          tradition: Database["public"]["Enums"]["church_tradition"]
          updated_at: string | null
          verified: boolean
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city_id: string
          claimed?: boolean
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          email?: string | null
          featured?: boolean
          google_maps_url?: string | null
          id?: string
          import_source?: Json | null
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          pastor_name?: string | null
          phone?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          tradition: Database["public"]["Enums"]["church_tradition"]
          updated_at?: string | null
          verified?: boolean
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string
          claimed?: boolean
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          email?: string | null
          featured?: boolean
          google_maps_url?: string | null
          id?: string
          import_source?: Json | null
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          pastor_name?: string | null
          phone?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          tradition?: Database["public"]["Enums"]["church_tradition"]
          updated_at?: string | null
          verified?: boolean
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "churches_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churches_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churches_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cidadeviva_leads: {
        Row: {
          business_id: string | null
          business_name: string | null
          city: string | null
          city_id: string | null
          consent: boolean
          created_at: string
          email: string
          form_type: string
          id: string
          message: string | null
          name: string | null
          page_path: string | null
          phone: string | null
          source: string
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          business_id?: string | null
          business_name?: string | null
          city?: string | null
          city_id?: string | null
          consent?: boolean
          created_at?: string
          email: string
          form_type?: string
          id?: string
          message?: string | null
          name?: string | null
          page_path?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          business_id?: string | null
          business_name?: string | null
          city?: string | null
          city_id?: string | null
          consent?: boolean
          created_at?: string
          email?: string
          form_type?: string
          id?: string
          message?: string | null
          name?: string | null
          page_path?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cidadeviva_leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cidadeviva_leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cidadeviva_leads_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          about: string | null
          created_at: string | null
          hero_url: string | null
          ibge_code: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          population: number | null
          slug: string
          state: string
          status: Database["public"]["Enums"]["city_status"] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string | null
          hero_url?: string | null
          ibge_code?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          population?: number | null
          slug: string
          state: string
          status?: Database["public"]["Enums"]["city_status"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string | null
          hero_url?: string | null
          ibge_code?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          population?: number | null
          slug?: string
          state?: string
          status?: Database["public"]["Enums"]["city_status"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      citizen_points: {
        Row: {
          balance: number
          city_id: string
          id: string
          lifetime_earned: number
          profile_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          city_id: string
          id?: string
          lifetime_earned?: number
          profile_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          city_id?: string
          id?: string
          lifetime_earned?: number
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "citizen_points_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citizen_points_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      city_faqs: {
        Row: {
          answer: string
          city_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          city_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          city_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_faqs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_faqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      city_modules: {
        Row: {
          city_id: string
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          module_key: string
        }
        Insert: {
          city_id: string
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          module_key: string
        }
        Update: {
          city_id?: string
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          module_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_modules_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_modules_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["key"]
          },
        ]
      }
      civic_news: {
        Row: {
          checksum: string
          city_id: string
          created_at: string
          excerpt: string | null
          id: string
          parse_confidence: number
          parser_warnings: string[]
          published_at: string | null
          raw_html_excerpt: string | null
          raw_text: string | null
          scraped_at: string
          source: string
          source_host: string
          source_url: string
          summary_ai: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          checksum: string
          city_id: string
          created_at?: string
          excerpt?: string | null
          id?: string
          parse_confidence?: number
          parser_warnings?: string[]
          published_at?: string | null
          raw_html_excerpt?: string | null
          raw_text?: string | null
          scraped_at?: string
          source: string
          source_host: string
          source_url: string
          summary_ai?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          checksum?: string
          city_id?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          parse_confidence?: number
          parser_warnings?: string[]
          published_at?: string | null
          raw_html_excerpt?: string | null
          raw_text?: string | null
          scraped_at?: string
          source?: string
          source_host?: string
          source_url?: string
          summary_ai?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_news_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_items: {
        Row: {
          aceita_troca: boolean
          classified_id: string
          condicao: Database["public"]["Enums"]["classified_item_condition"]
          created_at: string | null
          is_free_item: boolean
          marca: string | null
          motivo_venda: string | null
          updated_at: string | null
        }
        Insert: {
          aceita_troca?: boolean
          classified_id: string
          condicao?: Database["public"]["Enums"]["classified_item_condition"]
          created_at?: string | null
          is_free_item?: boolean
          marca?: string | null
          motivo_venda?: string | null
          updated_at?: string | null
        }
        Update: {
          aceita_troca?: boolean
          classified_id?: string
          condicao?: Database["public"]["Enums"]["classified_item_condition"]
          created_at?: string | null
          is_free_item?: boolean
          marca?: string | null
          motivo_venda?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classified_items_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: true
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_jobs: {
        Row: {
          beneficios: Json | null
          classified_id: string
          created_at: string | null
          faixa_salarial: string | null
          modalidade: Database["public"]["Enums"]["classified_job_work_mode"]
          requisitos: string | null
          tipo: Database["public"]["Enums"]["classified_job_contract_kind"]
          updated_at: string | null
        }
        Insert: {
          beneficios?: Json | null
          classified_id: string
          created_at?: string | null
          faixa_salarial?: string | null
          modalidade?: Database["public"]["Enums"]["classified_job_work_mode"]
          requisitos?: string | null
          tipo: Database["public"]["Enums"]["classified_job_contract_kind"]
          updated_at?: string | null
        }
        Update: {
          beneficios?: Json | null
          classified_id?: string
          created_at?: string | null
          faixa_salarial?: string | null
          modalidade?: Database["public"]["Enums"]["classified_job_work_mode"]
          requisitos?: string | null
          tipo?: Database["public"]["Enums"]["classified_job_contract_kind"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classified_jobs_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: true
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_reports: {
        Row: {
          city_id: string
          classified_id: string
          created_at: string | null
          id: string
          notes: string | null
          reason: string
          reporter_profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          city_id: string
          classified_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason: string
          reporter_profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          city_id?: string
          classified_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason?: string
          reporter_profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_reports_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_services: {
        Row: {
          area_atuacao: string
          atende_em_casa: boolean
          classified_id: string
          created_at: string | null
          faixa_preco: string | null
          raio_atendimento_km: number | null
          updated_at: string | null
        }
        Insert: {
          area_atuacao: string
          atende_em_casa?: boolean
          classified_id: string
          created_at?: string | null
          faixa_preco?: string | null
          raio_atendimento_km?: number | null
          updated_at?: string | null
        }
        Update: {
          area_atuacao?: string
          atende_em_casa?: boolean
          classified_id?: string
          created_at?: string | null
          faixa_preco?: string | null
          raio_atendimento_km?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classified_services_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: true
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_vehicles: {
        Row: {
          ano_fabricacao: number | null
          ano_modelo: number | null
          cambio: string | null
          classified_id: string
          combustivel: string | null
          cor: string | null
          created_at: string | null
          km: number | null
          marca: string
          modelo: string
          placa_final: string | null
          updated_at: string | null
        }
        Insert: {
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          cambio?: string | null
          classified_id: string
          combustivel?: string | null
          cor?: string | null
          created_at?: string | null
          km?: number | null
          marca: string
          modelo: string
          placa_final?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          cambio?: string | null
          classified_id?: string
          combustivel?: string | null
          cor?: string | null
          created_at?: string | null
          km?: number | null
          marca?: string
          modelo?: string
          placa_final?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classified_vehicles_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: true
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      classifieds: {
        Row: {
          attributes: Json | null
          author_profile_id: string | null
          category_label: string | null
          city_id: string
          contact_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          featured_until: string | null
          flagged_count: number
          id: string
          is_negotiable: boolean | null
          og_image_url: string | null
          og_square_image_url: string | null
          payment_amount_cents: number
          payment_provider_ref: string | null
          payment_status: Database["public"]["Enums"]["classified_payment_status"]
          photos: Json | null
          price: number | null
          rejection_reason: string | null
          review_decided_at: string | null
          review_decided_by_profile_id: string | null
          review_status: Database["public"]["Enums"]["classified_review_status"]
          slug: string
          sold_at: string | null
          status: Database["public"]["Enums"]["entity_status"] | null
          title: string
          type: Database["public"]["Enums"]["classified_kind"]
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          attributes?: Json | null
          author_profile_id?: string | null
          category_label?: string | null
          city_id: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          featured_until?: string | null
          flagged_count?: number
          id?: string
          is_negotiable?: boolean | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          payment_amount_cents?: number
          payment_provider_ref?: string | null
          payment_status?: Database["public"]["Enums"]["classified_payment_status"]
          photos?: Json | null
          price?: number | null
          rejection_reason?: string | null
          review_decided_at?: string | null
          review_decided_by_profile_id?: string | null
          review_status?: Database["public"]["Enums"]["classified_review_status"]
          slug: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          title: string
          type: Database["public"]["Enums"]["classified_kind"]
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          attributes?: Json | null
          author_profile_id?: string | null
          category_label?: string | null
          city_id?: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          featured_until?: string | null
          flagged_count?: number
          id?: string
          is_negotiable?: boolean | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          payment_amount_cents?: number
          payment_provider_ref?: string | null
          payment_status?: Database["public"]["Enums"]["classified_payment_status"]
          photos?: Json | null
          price?: number | null
          rejection_reason?: string | null
          review_decided_at?: string | null
          review_decided_by_profile_id?: string | null
          review_status?: Database["public"]["Enums"]["classified_review_status"]
          slug?: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["classified_kind"]
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classifieds_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classifieds_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classifieds_review_decided_by_profile_id_fkey"
            columns: ["review_decided_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_group_followers: {
        Row: {
          city_id: string
          created_at: string
          group_id: string
          id: string
          profile_id: string
          role: string
        }
        Insert: {
          city_id: string
          created_at?: string
          group_id: string
          id?: string
          profile_id: string
          role?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          group_id?: string
          id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_followers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_followers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_followers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_group_posts: {
        Row: {
          author_profile_id: string
          body: string | null
          city_id: string
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          ends_at: string | null
          external_url: string | null
          flagged_count: number
          group_id: string
          id: string
          image_url: string | null
          post_type: string
          starts_at: string | null
          status: Database["public"]["Enums"]["entity_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          body?: string | null
          city_id: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          ends_at?: string | null
          external_url?: string | null
          flagged_count?: number
          group_id: string
          id?: string
          image_url?: string | null
          post_type: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          body?: string | null
          city_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          ends_at?: string | null
          external_url?: string | null
          flagged_count?: number
          group_id?: string
          id?: string
          image_url?: string | null
          post_type?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_posts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          category: string
          city_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          featured_until: string | null
          flagged_count: number
          group_rules: string | null
          id: string
          instagram_url: string | null
          is_official: boolean
          last_verified_at: string | null
          member_estimate: number | null
          name: string
          neighborhood: string | null
          og_image_url: string | null
          owner_profile_id: string
          participation_instructions: string | null
          requires_approval: boolean
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          thumbnail_url: string | null
          type: string
          updated_at: string
          website_url: string | null
          whatsapp_invite_url: string | null
        }
        Insert: {
          category: string
          city_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          flagged_count?: number
          group_rules?: string | null
          id?: string
          instagram_url?: string | null
          is_official?: boolean
          last_verified_at?: string | null
          member_estimate?: number | null
          name: string
          neighborhood?: string | null
          og_image_url?: string | null
          owner_profile_id: string
          participation_instructions?: string | null
          requires_approval?: boolean
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          thumbnail_url?: string | null
          type: string
          updated_at?: string
          website_url?: string | null
          whatsapp_invite_url?: string | null
        }
        Update: {
          category?: string
          city_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          flagged_count?: number
          group_rules?: string | null
          id?: string
          instagram_url?: string | null
          is_official?: boolean
          last_verified_at?: string | null
          member_estimate?: number | null
          name?: string
          neighborhood?: string | null
          og_image_url?: string | null
          owner_profile_id?: string
          participation_instructions?: string | null
          requires_approval?: boolean
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          website_url?: string | null
          whatsapp_invite_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_groups_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_groups_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          city_id: string
          contact: string | null
          created_at: string
          id: string
          message: string
          metadata: Json
          related_page: string | null
          status: string
          subject: string
          type: string
          updated_at: string
        }
        Insert: {
          city_id: string
          contact?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          related_page?: string | null
          status?: string
          subject: string
          type: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          contact?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          related_page?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          city_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          reason: string
          reporter_profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          city_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          reason: string
          reporter_profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          city_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          reason?: string
          reporter_profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      council_meetings: {
        Row: {
          audio_url: string | null
          city_id: string
          created_at: string | null
          date: string
          id: string
          processed: boolean | null
          session_type: string | null
          source_url: string | null
          summary_ai: string | null
          transcript_storage_path: string | null
        }
        Insert: {
          audio_url?: string | null
          city_id: string
          created_at?: string | null
          date: string
          id?: string
          processed?: boolean | null
          session_type?: string | null
          source_url?: string | null
          summary_ai?: string | null
          transcript_storage_path?: string | null
        }
        Update: {
          audio_url?: string | null
          city_id?: string
          created_at?: string | null
          date?: string
          id?: string
          processed?: boolean | null
          session_type?: string | null
          source_url?: string | null
          summary_ai?: string | null
          transcript_storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "council_meetings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      council_propositions: {
        Row: {
          author: string | null
          checksum: string
          city_id: string
          created_at: string
          download_url: string | null
          external_id: string
          id: string
          number: string | null
          parse_confidence: number
          parser_warnings: string[]
          presented_at: string | null
          proposition_type: string | null
          raw_html_excerpt: string | null
          raw_text: string | null
          scraped_at: string
          situation: string | null
          source_host: string
          source_url: string
          summary_ai: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          checksum: string
          city_id: string
          created_at?: string
          download_url?: string | null
          external_id: string
          id?: string
          number?: string | null
          parse_confidence?: number
          parser_warnings?: string[]
          presented_at?: string | null
          proposition_type?: string | null
          raw_html_excerpt?: string | null
          raw_text?: string | null
          scraped_at?: string
          situation?: string | null
          source_host: string
          source_url: string
          summary_ai?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          checksum?: string
          city_id?: string
          created_at?: string
          download_url?: string | null
          external_id?: string
          id?: string
          number?: string | null
          parse_confidence?: number
          parser_warnings?: string[]
          presented_at?: string | null
          proposition_type?: string | null
          raw_html_excerpt?: string | null
          raw_text?: string | null
          scraped_at?: string
          situation?: string | null
          source_host?: string
          source_url?: string
          summary_ai?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_propositions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      council_topics: {
        Row: {
          author_councilor: string | null
          created_at: string | null
          id: string
          meeting_id: string
          summary_ai: string | null
          title: string | null
          topic_type: string | null
          vote_result: string | null
        }
        Insert: {
          author_councilor?: string | null
          created_at?: string | null
          id?: string
          meeting_id: string
          summary_ai?: string | null
          title?: string | null
          topic_type?: string | null
          vote_result?: string | null
        }
        Update: {
          author_councilor?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string
          summary_ai?: string | null
          title?: string | null
          topic_type?: string | null
          vote_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "council_topics_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "council_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      device_push_tokens: {
        Row: {
          app_version: string | null
          created_at: string
          device_name: string | null
          id: string
          last_seen_at: string
          platform: string
          profile_id: string
          token: string
          updated_at: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          last_seen_at?: string
          platform: string
          profile_id: string
          token: string
          updated_at?: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          last_seen_at?: string
          platform?: string
          profile_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      diary_acts: {
        Row: {
          act_type: string | null
          created_at: string | null
          diary_id: string
          id: string
          importance: string | null
          number: string | null
          raw_text: string | null
          source_references: Json | null
          summary_ai: string | null
          title: string | null
        }
        Insert: {
          act_type?: string | null
          created_at?: string | null
          diary_id: string
          id?: string
          importance?: string | null
          number?: string | null
          raw_text?: string | null
          source_references?: Json | null
          summary_ai?: string | null
          title?: string | null
        }
        Update: {
          act_type?: string | null
          created_at?: string | null
          diary_id?: string
          id?: string
          importance?: string | null
          number?: string | null
          raw_text?: string | null
          source_references?: Json | null
          summary_ai?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diary_acts_diary_id_fkey"
            columns: ["diary_id"]
            isOneToOne: false
            referencedRelation: "official_diaries"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          city_id: string
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          slug: string
          zone: string | null
        }
        Insert: {
          city_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          slug: string
          zone?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          slug?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "districts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          city_id: string | null
          content: string
          content_hash: string | null
          created_at: string | null
          embedding: string | null
          entity_id: string
          entity_type: string
          id: string
          indexed_at: string | null
        }
        Insert: {
          city_id?: string | null
          content: string
          content_hash?: string | null
          created_at?: string | null
          embedding?: string | null
          entity_id: string
          entity_type: string
          id?: string
          indexed_at?: string | null
        }
        Update: {
          city_id?: string | null
          content?: string
          content_hash?: string | null
          created_at?: string | null
          embedding?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          indexed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          active: boolean | null
          address: string | null
          category: string
          city_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          email: string | null
          hours_legacy_text: string | null
          id: string
          last_verified_at: string | null
          name: string
          needs_verification: boolean
          note: string | null
          phone: string
          short_dial: string | null
          source_type: string
          tags: Json
          updated_at: string | null
          whatsapp: string | null
          when_to_use: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          category: string
          city_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          email?: string | null
          hours_legacy_text?: string | null
          id?: string
          last_verified_at?: string | null
          name: string
          needs_verification?: boolean
          note?: string | null
          phone: string
          short_dial?: string | null
          source_type?: string
          tags?: Json
          updated_at?: string | null
          whatsapp?: string | null
          when_to_use?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          category?: string
          city_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          email?: string | null
          hours_legacy_text?: string | null
          id?: string
          last_verified_at?: string | null
          name?: string
          needs_verification?: boolean
          note?: string | null
          phone?: string
          short_dial?: string | null
          source_type?: string
          tags?: Json
          updated_at?: string | null
          whatsapp?: string | null
          when_to_use?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_faqs: {
        Row: {
          active: boolean
          answer: string
          city_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          question: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          answer: string
          city_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          answer?: string
          city_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_faqs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_hours: {
        Row: {
          active: boolean
          city_id: string
          created_at: string | null
          ends_at: string | null
          entity_id: string
          entity_type: string
          id: string
          kind: string
          note: string | null
          source_status: string
          starts_at: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          weekday: number
        }
        Insert: {
          active?: boolean
          city_id: string
          created_at?: string | null
          ends_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          kind?: string
          note?: string | null
          source_status?: string
          starts_at: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          weekday: number
        }
        Update: {
          active?: boolean
          city_id?: string
          created_at?: string | null
          ends_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          kind?: string
          note?: string | null
          source_status?: string
          starts_at?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "entity_hours_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_managers: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          invited_at: string | null
          invited_by: string | null
          profile_id: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          profile_id: string
          role?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_managers_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_managers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_posts: {
        Row: {
          body: string | null
          button_label: string | null
          button_url: string | null
          city_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          image_url: string | null
          pinned: boolean
          published_at: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body?: string | null
          button_label?: string | null
          button_url?: string | null
          city_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          published_at?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body?: string | null
          button_label?: string | null
          button_url?: string | null
          city_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          published_at?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_posts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_services: {
        Row: {
          active: boolean
          city_id: string
          created_at: string | null
          description: string | null
          duration_min: number | null
          entity_id: string
          entity_type: string
          id: string
          name: string
          price_cents: number | null
          requirements: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          city_id: string
          created_at?: string | null
          description?: string | null
          duration_min?: number | null
          entity_id: string
          entity_type: string
          id?: string
          name: string
          price_cents?: number | null
          requirements?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          city_id?: string
          created_at?: string | null
          description?: string | null
          duration_min?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          name?: string
          price_cents?: number | null
          requirements?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_services_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          city_id: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          city_id?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          city_id?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_categories_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          capacity: number | null
          category_id: string | null
          city_id: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          end_at: string | null
          featured: boolean | null
          id: string
          is_free: boolean | null
          lat: number | null
          lng: number | null
          location: string | null
          og_image_url: string | null
          og_square_image_url: string | null
          organizer_business_id: string | null
          organizer_name: string | null
          organizer_profile_id: string | null
          photos: Json | null
          slug: string
          start_at: string
          status: Database["public"]["Enums"]["entity_status"] | null
          ticket_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          category_id?: string | null
          city_id: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          featured?: boolean | null
          id?: string
          is_free?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          organizer_business_id?: string | null
          organizer_name?: string | null
          organizer_profile_id?: string | null
          photos?: Json | null
          slug: string
          start_at: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          ticket_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          category_id?: string | null
          city_id?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          featured?: boolean | null
          id?: string
          is_free?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          organizer_business_id?: string | null
          organizer_name?: string | null
          organizer_profile_id?: string | null
          photos?: Json | null
          slug?: string
          start_at?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          ticket_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_business_id_fkey"
            columns: ["organizer_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_business_id_fkey"
            columns: ["organizer_business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_profile_id_fkey"
            columns: ["organizer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_orders: {
        Row: {
          amount_cents: number
          asaas_customer_id: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          asaas_pix_expires_at: string | null
          asaas_pix_payload: string | null
          asaas_pix_qr_code: string | null
          billing_type: string | null
          city_id: string
          created_at: string
          duration_days: number
          failure_reason: string | null
          granted_until: string | null
          id: string
          metadata: Json
          paid_at: string | null
          plan_slug: string
          profile_id: string
          status: Database["public"]["Enums"]["feature_order_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["feature_order_target"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          asaas_customer_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_expires_at?: string | null
          asaas_pix_payload?: string | null
          asaas_pix_qr_code?: string | null
          billing_type?: string | null
          city_id: string
          created_at?: string
          duration_days: number
          failure_reason?: string | null
          granted_until?: string | null
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_slug: string
          profile_id: string
          status?: Database["public"]["Enums"]["feature_order_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["feature_order_target"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          asaas_customer_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_expires_at?: string | null
          asaas_pix_payload?: string | null
          asaas_pix_qr_code?: string | null
          billing_type?: string | null
          city_id?: string
          created_at?: string
          duration_days?: number
          failure_reason?: string | null
          granted_until?: string | null
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_slug?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["feature_order_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["feature_order_target"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_orders_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_orders_plan_slug_fkey"
            columns: ["plan_slug"]
            isOneToOne: false
            referencedRelation: "feature_plans"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "feature_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_plans: {
        Row: {
          amount_cents: number
          applies_to: string[]
          created_at: string
          description: string
          duration_days: number
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          applies_to?: string[]
          created_at?: string
          description: string
          duration_days: number
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          applies_to?: string[]
          created_at?: string
          description?: string
          duration_days?: number
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ferry_alerts: {
        Row: {
          active: boolean
          city_id: string
          created_at: string | null
          display_order: number
          ends_at: string | null
          id: string
          message: string
          route_id: string | null
          starts_at: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          city_id: string
          created_at?: string | null
          display_order?: number
          ends_at?: string | null
          id?: string
          message: string
          route_id?: string | null
          starts_at?: string | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          city_id?: string
          created_at?: string | null
          display_order?: number
          ends_at?: string | null
          id?: string
          message?: string
          route_id?: string | null
          starts_at?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ferry_alerts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ferry_alerts_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "ferry_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      ferry_routes: {
        Row: {
          active: boolean
          city_id: string
          confidence: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          display: Json
          display_order: number
          district: string | null
          endpoint_a_label: string | null
          endpoint_a_lat: number | null
          endpoint_a_lng: number | null
          endpoint_b_label: string | null
          endpoint_b_lat: number | null
          endpoint_b_lng: number | null
          fare: Json
          fare_summary: string | null
          fare_warning: string | null
          featured: boolean
          id: string
          important_info: Json
          keywords: string[]
          name: string
          og_image_url: string | null
          og_square_image_url: string | null
          operating_days: string[]
          region: string | null
          related_cities: string[]
          seo: Json
          short_name: string | null
          slug: string
          source: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          city_id: string
          confidence?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          display?: Json
          display_order?: number
          district?: string | null
          endpoint_a_label?: string | null
          endpoint_a_lat?: number | null
          endpoint_a_lng?: number | null
          endpoint_b_label?: string | null
          endpoint_b_lat?: number | null
          endpoint_b_lng?: number | null
          fare?: Json
          fare_summary?: string | null
          fare_warning?: string | null
          featured?: boolean
          id?: string
          important_info?: Json
          keywords?: string[]
          name: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          operating_days?: string[]
          region?: string | null
          related_cities?: string[]
          seo?: Json
          short_name?: string | null
          slug: string
          source?: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          city_id?: string
          confidence?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          display?: Json
          display_order?: number
          district?: string | null
          endpoint_a_label?: string | null
          endpoint_a_lat?: number | null
          endpoint_a_lng?: number | null
          endpoint_b_label?: string | null
          endpoint_b_lat?: number | null
          endpoint_b_lng?: number | null
          fare?: Json
          fare_summary?: string | null
          fare_warning?: string | null
          featured?: boolean
          id?: string
          important_info?: Json
          keywords?: string[]
          name?: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          operating_days?: string[]
          region?: string | null
          related_cities?: string[]
          seo?: Json
          short_name?: string | null
          slug?: string
          source?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ferry_routes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      ferry_schedule_items: {
        Row: {
          active: boolean
          city_id: string
          created_at: string | null
          departs_at: string
          destination: string | null
          direction: string
          display_order: number
          id: string
          notes: string | null
          origin: string | null
          route_id: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          city_id: string
          created_at?: string | null
          departs_at: string
          destination?: string | null
          direction: string
          display_order?: number
          id?: string
          notes?: string | null
          origin?: string | null
          route_id: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          city_id?: string
          created_at?: string | null
          departs_at?: string
          destination?: string | null
          direction?: string
          display_order?: number
          id?: string
          notes?: string | null
          origin?: string | null
          route_id?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ferry_schedule_items_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ferry_schedule_items_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "ferry_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      fishing_guides: {
        Row: {
          about: string | null
          city_id: string
          created_at: string | null
          email: string | null
          full_name: string
          has_boat: boolean | null
          id: string
          license_number: string | null
          og_image_url: string | null
          og_square_image_url: string | null
          owner_profile_id: string | null
          phone: string | null
          photo_url: string | null
          price_range: string | null
          services: Json | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"] | null
          verified: boolean | null
          whatsapp: string | null
        }
        Insert: {
          about?: string | null
          city_id: string
          created_at?: string | null
          email?: string | null
          full_name: string
          has_boat?: boolean | null
          id?: string
          license_number?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          photo_url?: string | null
          price_range?: string | null
          services?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          verified?: boolean | null
          whatsapp?: string | null
        }
        Update: {
          about?: string | null
          city_id?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          has_boat?: boolean | null
          id?: string
          license_number?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          photo_url?: string | null
          price_range?: string | null
          services?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          verified?: boolean | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fishing_guides_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishing_guides_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fishing_spots: {
        Row: {
          access_difficulty: string | null
          city_id: string
          cover_url: string | null
          created_at: string | null
          defeso_period: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          photos: Json | null
          regulations: string | null
          requires_guide: boolean | null
          slug: string
          species: Json | null
          status: Database["public"]["Enums"]["entity_status"] | null
        }
        Insert: {
          access_difficulty?: string | null
          city_id: string
          cover_url?: string | null
          created_at?: string | null
          defeso_period?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          photos?: Json | null
          regulations?: string | null
          requires_guide?: boolean | null
          slug: string
          species?: Json | null
          status?: Database["public"]["Enums"]["entity_status"] | null
        }
        Update: {
          access_difficulty?: string | null
          city_id?: string
          cover_url?: string | null
          created_at?: string | null
          defeso_period?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          photos?: Json | null
          regulations?: string | null
          requires_guide?: boolean | null
          slug?: string
          species?: Json | null
          status?: Database["public"]["Enums"]["entity_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fishing_spots_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      garbage_schedules: {
        Row: {
          active: boolean | null
          city_id: string
          created_at: string | null
          day_of_week: number
          district_id: string
          end_time: string | null
          id: string
          notes: string | null
          start_time: string | null
          type: Database["public"]["Enums"]["garbage_kind"] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          city_id: string
          created_at?: string | null
          day_of_week: number
          district_id: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string | null
          type?: Database["public"]["Enums"]["garbage_kind"] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          city_id?: string
          created_at?: string | null
          day_of_week?: number
          district_id?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string | null
          type?: Database["public"]["Enums"]["garbage_kind"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garbage_schedules_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garbage_schedules_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_linked_entities: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          guide_id: string
          id: string
          label: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          guide_id: string
          id?: string
          label?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          guide_id?: string
          id?: string
          label?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "guide_linked_entities_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tourism_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_photos: {
        Row: {
          author_profile_id: string
          caption: string | null
          city_id: string
          created_at: string
          guide_id: string
          id: string
          status: Database["public"]["Enums"]["entity_status"]
          storage_path: string
        }
        Insert: {
          author_profile_id: string
          caption?: string | null
          city_id: string
          created_at?: string
          guide_id: string
          id?: string
          status?: Database["public"]["Enums"]["entity_status"]
          storage_path: string
        }
        Update: {
          author_profile_id?: string
          caption?: string | null
          city_id?: string
          created_at?: string
          guide_id?: string
          id?: string
          status?: Database["public"]["Enums"]["entity_status"]
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_photos_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_photos_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_photos_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tourism_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_reviews: {
        Row: {
          author_profile_id: string
          city_id: string
          comment: string | null
          created_at: string
          guide_id: string
          id: string
          photo_url: string | null
          rating: number
          reply_at: string | null
          reply_owner: string | null
          status: Database["public"]["Enums"]["entity_status"]
          title: string | null
          visit_date: string | null
        }
        Insert: {
          author_profile_id: string
          city_id: string
          comment?: string | null
          created_at?: string
          guide_id: string
          id?: string
          photo_url?: string | null
          rating: number
          reply_at?: string | null
          reply_owner?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          title?: string | null
          visit_date?: string | null
        }
        Update: {
          author_profile_id?: string
          city_id?: string
          comment?: string | null
          created_at?: string
          guide_id?: string
          id?: string
          photo_url?: string | null
          rating?: number
          reply_at?: string | null
          reply_owner?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          title?: string | null
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_reviews_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_reviews_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_reviews_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tourism_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      health_campaigns: {
        Row: {
          active: boolean | null
          city_id: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          end_at: string | null
          id: string
          location: string | null
          og_image_url: string | null
          og_square_image_url: string | null
          start_at: string | null
          target_group: string | null
          title: string
          vaccine_or_topic: string | null
        }
        Insert: {
          active?: boolean | null
          city_id: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          start_at?: string | null
          target_group?: string | null
          title: string
          vaccine_or_topic?: string | null
        }
        Update: {
          active?: boolean | null
          city_id?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          start_at?: string | null
          target_group?: string | null
          title?: string
          vaccine_or_topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_campaigns_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      health_facilities: {
        Row: {
          active: boolean | null
          address: string | null
          city_id: string
          created_at: string | null
          display_order: number
          district_id: string | null
          hours_legacy_text: string | null
          id: string
          last_verified_at: string | null
          lat: number | null
          lng: number | null
          name: string
          needs_verification: boolean
          neighborhood: string | null
          note: string | null
          phone: string | null
          requirements: Json
          secondary_phone: string | null
          services: Json | null
          slug: string | null
          source_type: string
          tags: Json
          type: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city_id: string
          created_at?: string | null
          display_order?: number
          district_id?: string | null
          hours_legacy_text?: string | null
          id?: string
          last_verified_at?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          needs_verification?: boolean
          neighborhood?: string | null
          note?: string | null
          phone?: string | null
          requirements?: Json
          secondary_phone?: string | null
          services?: Json | null
          slug?: string | null
          source_type?: string
          tags?: Json
          type: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city_id?: string
          created_at?: string | null
          display_order?: number
          district_id?: string | null
          hours_legacy_text?: string | null
          id?: string
          last_verified_at?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          needs_verification?: boolean
          neighborhood?: string | null
          note?: string | null
          phone?: string | null
          requirements?: Json
          secondary_phone?: string | null
          services?: Json | null
          slug?: string | null
          source_type?: string
          tags?: Json
          type?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_facilities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_facilities_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      home_banner_requests: {
        Row: {
          art_piece_id: string | null
          business_id: string
          city_id: string
          created_at: string
          created_by: string | null
          id: string
          image_asset_id: string | null
          image_url: string
          link_url: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          art_piece_id?: string | null
          business_id: string
          city_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_asset_id?: string | null
          image_url: string
          link_url?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          art_piece_id?: string | null
          business_id?: string
          city_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_asset_id?: string | null
          image_url?: string
          link_url?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_banner_requests_art_piece_id_fkey"
            columns: ["art_piece_id"]
            isOneToOne: false
            referencedRelation: "art_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_banner_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_banner_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_banner_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_banner_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_banner_requests_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_banner_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      home_block_banners: {
        Row: {
          active: boolean
          block_id: string
          city_id: string
          created_at: string | null
          end_at: string | null
          id: string
          image_asset_id: string
          link_target: string
          link_type: string
          link_url: string | null
          position: number
          start_at: string | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
          video_asset_id: string | null
        }
        Insert: {
          active?: boolean
          block_id: string
          city_id: string
          created_at?: string | null
          end_at?: string | null
          id?: string
          image_asset_id: string
          link_target?: string
          link_type?: string
          link_url?: string | null
          position?: number
          start_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          video_asset_id?: string | null
        }
        Update: {
          active?: boolean
          block_id?: string
          city_id?: string
          created_at?: string | null
          end_at?: string | null
          id?: string
          image_asset_id?: string
          link_target?: string
          link_type?: string
          link_url?: string | null
          position?: number
          start_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          video_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_block_banners_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "home_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_block_banners_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_block_banners_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_block_banners_video_asset_id_fkey"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      home_blocks: {
        Row: {
          city_id: string
          config: Json
          created_at: string | null
          enabled: boolean
          group_title: string | null
          group_with_next: boolean
          id: string
          layout_id: string
          position: number
          title: string | null
          type: Database["public"]["Enums"]["home_block_type"]
          updated_at: string | null
        }
        Insert: {
          city_id: string
          config?: Json
          created_at?: string | null
          enabled?: boolean
          group_title?: string | null
          group_with_next?: boolean
          id?: string
          layout_id: string
          position?: number
          title?: string | null
          type: Database["public"]["Enums"]["home_block_type"]
          updated_at?: string | null
        }
        Update: {
          city_id?: string
          config?: Json
          created_at?: string | null
          enabled?: boolean
          group_title?: string | null
          group_with_next?: boolean
          id?: string
          layout_id?: string
          position?: number
          title?: string | null
          type?: Database["public"]["Enums"]["home_block_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_blocks_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_blocks_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "home_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      home_layouts: {
        Row: {
          city_id: string
          config: Json
          created_at: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          city_id: string
          config?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          city_id?: string
          config?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_layouts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_layouts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      home_video_ad_events: {
        Row: {
          ad_id: string
          event_type: string
          id: string
          occurred_at: string
          platform: string | null
          profile_id: string | null
        }
        Insert: {
          ad_id: string
          event_type: string
          id?: string
          occurred_at?: string
          platform?: string | null
          profile_id?: string | null
        }
        Update: {
          ad_id?: string
          event_type?: string
          id?: string
          occurred_at?: string
          platform?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_video_ad_events_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "home_video_ads"
            referencedColumns: ["id"]
          },
        ]
      }
      home_video_ads: {
        Row: {
          aspect_ratio: number
          business_id: string | null
          city_id: string
          click_url: string
          created_at: string
          cta_label: string
          ends_at: string | null
          id: string
          mute_default: boolean
          poster_url: string | null
          priority: number
          starts_at: string | null
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          aspect_ratio?: number
          business_id?: string | null
          city_id: string
          click_url: string
          created_at?: string
          cta_label?: string
          ends_at?: string | null
          id?: string
          mute_default?: boolean
          poster_url?: string | null
          priority?: number
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          aspect_ratio?: number
          business_id?: string | null
          city_id?: string
          click_url?: string
          created_at?: string
          cta_label?: string
          ends_at?: string | null
          id?: string
          mute_default?: boolean
          poster_url?: string | null
          priority?: number
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_video_ads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_video_ads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_video_ads_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      indexing_queue: {
        Row: {
          attempts: number
          city_id: string
          created_at: string
          enqueued_at: string
          entity_id: string
          entity_type: string
          id: string
          last_error: string | null
          operation: string
          processed_at: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          city_id: string
          created_at?: string
          enqueued_at?: string
          entity_id: string
          entity_type: string
          id?: string
          last_error?: string | null
          operation: string
          processed_at?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          city_id?: string
          created_at?: string
          enqueued_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          last_error?: string | null
          operation?: string
          processed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexing_queue_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      live_feed_items: {
        Row: {
          city_id: string
          created_at: string
          dedupe_key: string | null
          expires_at: string | null
          href: string | null
          id: string
          label: string
          payload: Json
          priority: number
          published_at: string
          source_id: string | null
          source_kind: string
          source_name: string | null
          starts_at: string
          status: string
          suffix: string | null
          title: string
          tone: string
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          dedupe_key?: string | null
          expires_at?: string | null
          href?: string | null
          id?: string
          label: string
          payload?: Json
          priority?: number
          published_at?: string
          source_id?: string | null
          source_kind: string
          source_name?: string | null
          starts_at?: string
          status?: string
          suffix?: string | null
          title: string
          tone?: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          dedupe_key?: string | null
          expires_at?: string | null
          href?: string | null
          id?: string
          label?: string
          payload?: Json
          priority?: number
          published_at?: string
          source_id?: string | null
          source_kind?: string
          source_name?: string | null
          starts_at?: string
          status?: string
          suffix?: string | null
          title?: string
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_feed_items_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_and_found: {
        Row: {
          author_profile_id: string | null
          category: string | null
          city_id: string
          contact_phone: string | null
          contact_whatsapp: string | null
          cover_url: string | null
          created_at: string | null
          district_id: string | null
          flagged_count: number
          id: string
          item_description: string
          location: string | null
          moderation_status: Database["public"]["Enums"]["entity_status"] | null
          occurred_at: string | null
          og_image_url: string | null
          og_square_image_url: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          author_profile_id?: string | null
          category?: string | null
          city_id: string
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string | null
          district_id?: string | null
          flagged_count?: number
          id?: string
          item_description: string
          location?: string | null
          moderation_status?:
            | Database["public"]["Enums"]["entity_status"]
            | null
          occurred_at?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          author_profile_id?: string | null
          category?: string | null
          city_id?: string
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string | null
          district_id?: string | null
          flagged_count?: number
          id?: string
          item_description?: string
          location?: string | null
          moderation_status?:
            | Database["public"]["Enums"]["entity_status"]
            | null
          occurred_at?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_and_found_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_and_found_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_and_found_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_pets: {
        Row: {
          age_months: number | null
          author_profile_id: string | null
          breed: string | null
          city_id: string
          color: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          district_id: string | null
          flagged_count: number
          has_collar: boolean | null
          id: string
          last_seen_at: string | null
          last_seen_location: string | null
          lat: number | null
          lng: number | null
          microchip: boolean | null
          moderation_status: Database["public"]["Enums"]["entity_status"] | null
          og_image_url: string | null
          og_square_image_url: string | null
          pet_name: string | null
          photos: Json | null
          size: string | null
          species: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          age_months?: number | null
          author_profile_id?: string | null
          breed?: string | null
          city_id: string
          color?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          flagged_count?: number
          has_collar?: boolean | null
          id?: string
          last_seen_at?: string | null
          last_seen_location?: string | null
          lat?: number | null
          lng?: number | null
          microchip?: boolean | null
          moderation_status?:
            | Database["public"]["Enums"]["entity_status"]
            | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          pet_name?: string | null
          photos?: Json | null
          size?: string | null
          species?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          age_months?: number | null
          author_profile_id?: string | null
          breed?: string | null
          city_id?: string
          color?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          flagged_count?: number
          has_collar?: boolean | null
          id?: string
          last_seen_at?: string | null
          last_seen_location?: string | null
          lat?: number | null
          lng?: number | null
          microchip?: boolean | null
          moderation_status?:
            | Database["public"]["Enums"]["entity_status"]
            | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          pet_name?: string | null
          photos?: Json | null
          size?: string | null
          species?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_pets_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pets_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pets_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bucket: string
          cdn_url: string
          checksum_sha256: string | null
          city_id: string
          content_type: string
          created_at: string | null
          height: number | null
          id: string
          metadata: Json
          original_filename: string | null
          provider: string
          size_bytes: number
          status: string
          storage_path: string
          updated_at: string | null
          uploaded_by_profile_id: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          cdn_url: string
          checksum_sha256?: string | null
          city_id: string
          content_type: string
          created_at?: string | null
          height?: number | null
          id?: string
          metadata?: Json
          original_filename?: string | null
          provider?: string
          size_bytes: number
          status?: string
          storage_path: string
          updated_at?: string | null
          uploaded_by_profile_id?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          cdn_url?: string
          checksum_sha256?: string | null
          city_id?: string
          content_type?: string
          created_at?: string | null
          height?: number | null
          id?: string
          metadata?: Json
          original_filename?: string | null
          provider?: string
          size_bytes?: number
          status?: string
          storage_path?: string
          updated_at?: string | null
          uploaded_by_profile_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_uploaded_by_profile_id_fkey"
            columns: ["uploaded_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_links: {
        Row: {
          asset_id: string
          city_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_primary: boolean
          position: number
          role: string
          updated_at: string | null
        }
        Insert: {
          asset_id: string
          city_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_primary?: boolean
          position?: number
          role: string
          updated_at?: string | null
        }
        Update: {
          asset_id?: string
          city_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_primary?: boolean
          position?: number
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_links_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_requests: {
        Row: {
          business_hint: string | null
          city_id: string
          created_at: string | null
          id: string
          justification: string | null
          profile_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          business_hint?: string | null
          city_id: string
          created_at?: string | null
          id?: string
          justification?: string | null
          profile_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          business_hint?: string | null
          city_id?: string
          created_at?: string | null
          id?: string
          justification?: string | null
          profile_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      mobile_update_channels: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          label: string
          priority: number
          runtime_version: string | null
          updated_at: string
          url: string
        }
        Insert: {
          channel: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          label: string
          priority?: number
          runtime_version?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          label?: string
          priority?: number
          runtime_version?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          default_enabled: boolean | null
          description: string | null
          display_order: number | null
          icon: string | null
          key: string
          name: string
        }
        Insert: {
          default_enabled?: boolean | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          key: string
          name: string
        }
        Update: {
          default_enabled?: boolean | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          key?: string
          name?: string
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          city_id: string
          clicks_count: number
          created_at: string | null
          html_storage_path: string | null
          id: string
          opens_count: number
          recipients_count: number
          sent_at: string | null
          subject: string
        }
        Insert: {
          city_id: string
          clicks_count?: number
          created_at?: string | null
          html_storage_path?: string | null
          id?: string
          opens_count?: number
          recipients_count?: number
          sent_at?: string | null
          subject: string
        }
        Update: {
          city_id?: string
          clicks_count?: number
          created_at?: string | null
          html_storage_path?: string | null
          id?: string
          opens_count?: number
          recipients_count?: number
          sent_at?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_campaigns_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_consent_history: {
        Row: {
          city_id: string
          consent_text_version: string | null
          created_at: string | null
          email: string
          event: string
          id: string
          ip_hash: string | null
          source: string | null
          subscriber_id: string | null
          user_agent_hash: string | null
        }
        Insert: {
          city_id: string
          consent_text_version?: string | null
          created_at?: string | null
          email: string
          event: string
          id?: string
          ip_hash?: string | null
          source?: string | null
          subscriber_id?: string | null
          user_agent_hash?: string | null
        }
        Update: {
          city_id?: string
          consent_text_version?: string | null
          created_at?: string | null
          email?: string
          event?: string
          id?: string
          ip_hash?: string | null
          source?: string | null
          subscriber_id?: string | null
          user_agent_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_consent_history_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_consent_history_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          city_id: string
          confirmation_token_hash: string | null
          confirmed_at: string | null
          consent_text_version: string
          created_at: string | null
          email: string
          id: string
          source: string
          unsubscribe_token_hash: string | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          city_id: string
          confirmation_token_hash?: string | null
          confirmed_at?: string | null
          consent_text_version?: string
          created_at?: string | null
          email: string
          id?: string
          source?: string
          unsubscribe_token_hash?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          city_id?: string
          confirmation_token_hash?: string | null
          confirmed_at?: string | null
          consent_text_version?: string
          created_at?: string | null
          email?: string
          id?: string
          source?: string
          unsubscribe_token_hash?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          error_message: string | null
          failed_at: string | null
          id: string
          notification_id: string
          provider: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_delivery_status"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          notification_id: string
          provider?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_delivery_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          notification_id?: string
          provider?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_delivery_status"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_devices: {
        Row: {
          created_at: string
          disabled_at: string | null
          id: string
          last_seen_at: string
          platform: string | null
          profile_id: string
          provider: string
          token_encrypted: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string | null
          id?: string
          last_seen_at?: string
          platform?: string | null
          profile_id: string
          provider?: string
          token_encrypted?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          disabled_at?: string | null
          id?: string
          last_seen_at?: string
          platform?: string | null
          profile_id?: string
          provider?: string
          token_encrypted?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_devices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          city_id: string | null
          created_at: string
          email_enabled: boolean
          id: string
          profile_id: string
          push_enabled: boolean
          type: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          email_enabled?: boolean
          id?: string
          profile_id: string
          push_enabled?: boolean
          type: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          email_enabled?: boolean
          id?: string
          profile_id?: string
          push_enabled?: boolean
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          archived_at: string | null
          audience: Database["public"]["Enums"]["notification_audience"]
          body: string | null
          city_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["notification_priority"]
          push_payload: Json | null
          read_at: string | null
          recipient_profile_id: string
          target_url: string
          title: string
          type: string
        }
        Insert: {
          archived_at?: string | null
          audience?: Database["public"]["Enums"]["notification_audience"]
          body?: string | null
          city_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          push_payload?: Json | null
          read_at?: string | null
          recipient_profile_id: string
          target_url: string
          title: string
          type: string
        }
        Update: {
          archived_at?: string | null
          audience?: Database["public"]["Enums"]["notification_audience"]
          body?: string | null
          city_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          push_payload?: Json | null
          read_at?: string | null
          recipient_profile_id?: string
          target_url?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      obituaries: {
        Row: {
          age: number | null
          burial_at: string | null
          burial_location: string | null
          city_id: string
          created_at: string | null
          death_date: string
          family_message: string | null
          full_name: string
          funeral_home: string | null
          id: string
          mass_at: string | null
          mass_location: string | null
          og_image_url: string | null
          og_square_image_url: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["entity_status"] | null
          wake_at: string | null
          wake_location: string | null
        }
        Insert: {
          age?: number | null
          burial_at?: string | null
          burial_location?: string | null
          city_id: string
          created_at?: string | null
          death_date: string
          family_message?: string | null
          full_name: string
          funeral_home?: string | null
          id?: string
          mass_at?: string | null
          mass_location?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          wake_at?: string | null
          wake_location?: string | null
        }
        Update: {
          age?: number | null
          burial_at?: string | null
          burial_location?: string | null
          city_id?: string
          created_at?: string | null
          death_date?: string
          family_message?: string | null
          full_name?: string
          funeral_home?: string | null
          id?: string
          mass_at?: string | null
          mass_location?: string | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["entity_status"] | null
          wake_at?: string | null
          wake_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obituaries_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      official_diaries: {
        Row: {
          city_id: string
          created_at: string | null
          date: string
          id: string
          number: string | null
          pages: number | null
          processed: boolean | null
          raw_storage_path: string | null
          source_url: string | null
        }
        Insert: {
          city_id: string
          created_at?: string | null
          date: string
          id?: string
          number?: string | null
          pages?: number | null
          processed?: boolean | null
          raw_storage_path?: string | null
          source_url?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string | null
          date?: string
          id?: string
          number?: string | null
          pages?: number | null
          processed?: boolean | null
          raw_storage_path?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_diaries_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      og_image_jobs: {
        Row: {
          attempts: number
          city_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          error: string | null
          id: string
          max_attempts: number
          og_image_url: string | null
          og_square_image_url: string | null
          processed_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number
          city_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          error?: string | null
          id?: string
          max_attempts?: number
          og_image_url?: string | null
          og_square_image_url?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number
          city_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error?: string | null
          id?: string
          max_attempts?: number
          og_image_url?: string | null
          og_square_image_url?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "og_image_jobs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      order_daily_counters: {
        Row: {
          business_id: string
          day: string
          seq: number
        }
        Insert: {
          business_id: string
          day: string
          seq?: number
        }
        Update: {
          business_id?: string
          day?: string
          seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_daily_counters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_daily_counters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string | null
          name: string
          notes: string | null
          options_snapshot: Json
          order_id: string
          qty: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          name: string
          notes?: string | null
          options_snapshot?: Json
          order_id: string
          qty?: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          name?: string
          notes?: string | null
          options_snapshot?: Json
          order_id?: string
          qty?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string
          cancelled_at: string | null
          change_for: number | null
          channel: string
          city_id: string
          code: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_address: Json | null
          delivery_fee: number
          delivery_notes: string | null
          discount: number
          dispatched_at: string | null
          estimated_time_min: number | null
          id: string
          merchant_notes: string | null
          notes: string | null
          order_type: Database["public"]["Enums"]["order_kind"]
          payment_method:
            | Database["public"]["Enums"]["order_payment_method"]
            | null
          payment_status: Database["public"]["Enums"]["order_payment_status"]
          status: Database["public"]["Enums"]["order_status"]
          total: number
          total_items: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          cancelled_at?: string | null
          change_for?: number | null
          channel?: string
          city_id: string
          code?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_fee?: number
          delivery_notes?: string | null
          discount?: number
          dispatched_at?: string | null
          estimated_time_min?: number | null
          id?: string
          merchant_notes?: string | null
          notes?: string | null
          order_type: Database["public"]["Enums"]["order_kind"]
          payment_method?:
            | Database["public"]["Enums"]["order_payment_method"]
            | null
          payment_status?: Database["public"]["Enums"]["order_payment_status"]
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          total_items?: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          cancelled_at?: string | null
          change_for?: number | null
          channel?: string
          city_id?: string
          code?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_fee?: number
          delivery_notes?: string | null
          discount?: number
          dispatched_at?: string | null
          estimated_time_min?: number | null
          id?: string
          merchant_notes?: string | null
          notes?: string | null
          order_type?: Database["public"]["Enums"]["order_kind"]
          payment_method?:
            | Database["public"]["Enums"]["order_payment_method"]
            | null
          payment_status?: Database["public"]["Enums"]["order_payment_status"]
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          total_items?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          active: boolean | null
          address: string | null
          city_id: string
          created_at: string | null
          google_maps_url: string | null
          id: string
          is_24h: boolean | null
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city_id: string
          created_at?: string | null
          google_maps_url?: string | null
          id?: string
          is_24h?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city_id?: string
          created_at?: string | null
          google_maps_url?: string | null
          id?: string
          is_24h?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacies_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_shifts: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          notes: string | null
          pharmacy_id: string
          shift_type: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          notes?: string | null
          pharmacy_id: string
          shift_type?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          pharmacy_id?: string
          shift_type?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_shifts_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          balance_after: number
          city_id: string
          created_at: string
          delta: number
          id: string
          profile_id: string
          reason: string
          reference_id: string | null
        }
        Insert: {
          balance_after: number
          city_id: string
          created_at?: string
          delta: number
          id?: string
          profile_id: string
          reason: string
          reference_id?: string | null
        }
        Update: {
          balance_after?: number
          city_id?: string
          created_at?: string
          delta?: number
          id?: string
          profile_id?: string
          reason?: string
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_payment_events: {
        Row: {
          asaas_webhook_event_id: string | null
          created_at: string
          event_type: string
          id: string
          message: string | null
          payload: Json
          payment_id: string | null
          provider: Database["public"]["Enums"]["portal_payment_provider"]
          provider_event_id: string | null
          provider_status: string | null
        }
        Insert: {
          asaas_webhook_event_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          payload?: Json
          payment_id?: string | null
          provider?: Database["public"]["Enums"]["portal_payment_provider"]
          provider_event_id?: string | null
          provider_status?: string | null
        }
        Update: {
          asaas_webhook_event_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          payload?: Json
          payment_id?: string | null
          provider?: Database["public"]["Enums"]["portal_payment_provider"]
          provider_event_id?: string | null
          provider_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_payment_events_asaas_webhook_event_id_fkey"
            columns: ["asaas_webhook_event_id"]
            isOneToOne: false
            referencedRelation: "asaas_webhook_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "portal_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_payments: {
        Row: {
          amount_cents: number
          asaas_raw: Json
          billing_type: string | null
          city_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          external_reference: string | null
          id: string
          invoice_url: string | null
          metadata: Json
          net_amount_cents: number | null
          paid_at: string | null
          profile_id: string | null
          provider: Database["public"]["Enums"]["portal_payment_provider"]
          provider_customer_id: string | null
          provider_payment_id: string | null
          provider_subscription_id: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["portal_payment_source"]
          status: Database["public"]["Enums"]["portal_payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          asaas_raw?: Json
          billing_type?: string | null
          city_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          external_reference?: string | null
          id?: string
          invoice_url?: string | null
          metadata?: Json
          net_amount_cents?: number | null
          paid_at?: string | null
          profile_id?: string | null
          provider?: Database["public"]["Enums"]["portal_payment_provider"]
          provider_customer_id?: string | null
          provider_payment_id?: string | null
          provider_subscription_id?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["portal_payment_source"]
          status?: Database["public"]["Enums"]["portal_payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          asaas_raw?: Json
          billing_type?: string | null
          city_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          external_reference?: string | null
          id?: string
          invoice_url?: string | null
          metadata?: Json
          net_amount_cents?: number | null
          paid_at?: string | null
          profile_id?: string | null
          provider?: Database["public"]["Enums"]["portal_payment_provider"]
          provider_customer_id?: string | null
          provider_payment_id?: string | null
          provider_subscription_id?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["portal_payment_source"]
          status?: Database["public"]["Enums"]["portal_payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_payments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_consent_events: {
        Row: {
          anonymous_id: string | null
          city_id: string | null
          consent_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["privacy_consent_event_type"]
          granted: boolean
          id: string
          ip_hash: string | null
          metadata: Json
          policy_version: string
          profile_id: string | null
          purpose: Database["public"]["Enums"]["privacy_consent_purpose"]
          source: string
          user_agent_hash: string | null
        }
        Insert: {
          anonymous_id?: string | null
          city_id?: string | null
          consent_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["privacy_consent_event_type"]
          granted: boolean
          id?: string
          ip_hash?: string | null
          metadata?: Json
          policy_version: string
          profile_id?: string | null
          purpose: Database["public"]["Enums"]["privacy_consent_purpose"]
          source?: string
          user_agent_hash?: string | null
        }
        Update: {
          anonymous_id?: string | null
          city_id?: string | null
          consent_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["privacy_consent_event_type"]
          granted?: boolean
          id?: string
          ip_hash?: string | null
          metadata?: Json
          policy_version?: string
          profile_id?: string | null
          purpose?: Database["public"]["Enums"]["privacy_consent_purpose"]
          source?: string
          user_agent_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "privacy_consent_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_consent_events_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "privacy_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_consent_events_policy_version_fkey"
            columns: ["policy_version"]
            isOneToOne: false
            referencedRelation: "privacy_policy_versions"
            referencedColumns: ["version"]
          },
          {
            foreignKeyName: "privacy_consent_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_consents: {
        Row: {
          anonymous_id: string | null
          city_id: string | null
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_hash: string | null
          policy_version: string
          profile_id: string | null
          purpose: Database["public"]["Enums"]["privacy_consent_purpose"]
          revoked_at: string | null
          source: string
          updated_at: string
          user_agent_hash: string | null
        }
        Insert: {
          anonymous_id?: string | null
          city_id?: string | null
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_hash?: string | null
          policy_version: string
          profile_id?: string | null
          purpose: Database["public"]["Enums"]["privacy_consent_purpose"]
          revoked_at?: string | null
          source?: string
          updated_at?: string
          user_agent_hash?: string | null
        }
        Update: {
          anonymous_id?: string | null
          city_id?: string | null
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_hash?: string | null
          policy_version?: string
          profile_id?: string | null
          purpose?: Database["public"]["Enums"]["privacy_consent_purpose"]
          revoked_at?: string | null
          source?: string
          updated_at?: string
          user_agent_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "privacy_consents_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_consents_policy_version_fkey"
            columns: ["policy_version"]
            isOneToOne: false
            referencedRelation: "privacy_policy_versions"
            referencedColumns: ["version"]
          },
          {
            foreignKeyName: "privacy_consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_policy_versions: {
        Row: {
          changelog: string | null
          created_at: string
          id: string
          public_url: string
          published_at: string
          title: string
          version: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          id?: string
          public_url?: string
          published_at?: string
          title: string
          version: string
        }
        Update: {
          changelog?: string | null
          created_at?: string
          id?: string
          public_url?: string
          published_at?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      privacy_requests: {
        Row: {
          city_id: string | null
          completed_at: string | null
          created_at: string
          details: string | null
          due_at: string
          export_storage_path: string | null
          id: string
          profile_id: string | null
          request_type: Database["public"]["Enums"]["privacy_request_type"]
          requester_email: string | null
          response_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["privacy_request_status"]
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          completed_at?: string | null
          created_at?: string
          details?: string | null
          due_at?: string
          export_storage_path?: string | null
          id?: string
          profile_id?: string | null
          request_type: Database["public"]["Enums"]["privacy_request_type"]
          requester_email?: string | null
          response_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["privacy_request_status"]
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          completed_at?: string | null
          created_at?: string
          details?: string | null
          due_at?: string
          export_storage_path?: string | null
          id?: string
          profile_id?: string | null
          request_type?: Database["public"]["Enums"]["privacy_request_type"]
          requester_email?: string | null
          response_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["privacy_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_roles: {
        Row: {
          city_id: string | null
          created_at: string | null
          granted_by: string | null
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["role_kind"]
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          granted_by?: string | null
          id?: string
          profile_id: string
          role: Database["public"]["Enums"]["role_kind"]
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          granted_by?: string | null
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["role_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          consent_marketing: boolean | null
          created_at: string | null
          default_city_id: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          consent_marketing?: boolean | null
          created_at?: string | null
          default_city_id?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          consent_marketing?: boolean | null
          created_at?: string | null
          default_city_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_city_id_fkey"
            columns: ["default_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          accepts_exchange: boolean | null
          accepts_financing: boolean | null
          address_complement: string | null
          address_number: string | null
          address_street: string | null
          agent_id: string | null
          amenities: Json | null
          area_total_m2: number | null
          area_useful_m2: number | null
          bathrooms: number | null
          bedrooms: number | null
          built_year: number | null
          cep: string | null
          city_id: string
          condo_fee: number | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          district_id: string | null
          exclusive: boolean | null
          expires_at: string | null
          featured: boolean | null
          featured_until: string | null
          floor: number | null
          floor_plan_url: string | null
          furnished: boolean | null
          has_garage: boolean | null
          has_garden: boolean | null
          has_grill: boolean | null
          has_pool: boolean | null
          id: string
          iptu_yearly: number | null
          lat: number | null
          listing_type: Database["public"]["Enums"]["listing_kind"]
          lng: number | null
          near_lake: boolean | null
          og_image_url: string | null
          og_square_image_url: string | null
          owner_profile_id: string | null
          parking_spaces: number | null
          payment_amount_cents: number
          payment_provider_ref: string | null
          payment_status: Database["public"]["Enums"]["property_payment_status"]
          pets_allowed: boolean | null
          photos: Json | null
          price: number | null
          property_type: Database["public"]["Enums"]["property_kind"]
          published_at: string | null
          published_by_profile_id: string | null
          realtor_id: string | null
          reference_code: string | null
          rejection_reason: string | null
          rent_price: number | null
          review_decided_at: string | null
          review_decided_by_profile_id: string | null
          review_status: Database["public"]["Enums"]["property_review_status"]
          show_exact_location: boolean | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"] | null
          suites: number | null
          title: string
          tour_360_url: string | null
          updated_at: string | null
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          accepts_exchange?: boolean | null
          accepts_financing?: boolean | null
          address_complement?: string | null
          address_number?: string | null
          address_street?: string | null
          agent_id?: string | null
          amenities?: Json | null
          area_total_m2?: number | null
          area_useful_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_year?: number | null
          cep?: string | null
          city_id: string
          condo_fee?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          exclusive?: boolean | null
          expires_at?: string | null
          featured?: boolean | null
          featured_until?: string | null
          floor?: number | null
          floor_plan_url?: string | null
          furnished?: boolean | null
          has_garage?: boolean | null
          has_garden?: boolean | null
          has_grill?: boolean | null
          has_pool?: boolean | null
          id?: string
          iptu_yearly?: number | null
          lat?: number | null
          listing_type: Database["public"]["Enums"]["listing_kind"]
          lng?: number | null
          near_lake?: boolean | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          parking_spaces?: number | null
          payment_amount_cents?: number
          payment_provider_ref?: string | null
          payment_status?: Database["public"]["Enums"]["property_payment_status"]
          pets_allowed?: boolean | null
          photos?: Json | null
          price?: number | null
          property_type: Database["public"]["Enums"]["property_kind"]
          published_at?: string | null
          published_by_profile_id?: string | null
          realtor_id?: string | null
          reference_code?: string | null
          rejection_reason?: string | null
          rent_price?: number | null
          review_decided_at?: string | null
          review_decided_by_profile_id?: string | null
          review_status?: Database["public"]["Enums"]["property_review_status"]
          show_exact_location?: boolean | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          suites?: number | null
          title: string
          tour_360_url?: string | null
          updated_at?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          accepts_exchange?: boolean | null
          accepts_financing?: boolean | null
          address_complement?: string | null
          address_number?: string | null
          address_street?: string | null
          agent_id?: string | null
          amenities?: Json | null
          area_total_m2?: number | null
          area_useful_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_year?: number | null
          cep?: string | null
          city_id?: string
          condo_fee?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          exclusive?: boolean | null
          expires_at?: string | null
          featured?: boolean | null
          featured_until?: string | null
          floor?: number | null
          floor_plan_url?: string | null
          furnished?: boolean | null
          has_garage?: boolean | null
          has_garden?: boolean | null
          has_grill?: boolean | null
          has_pool?: boolean | null
          id?: string
          iptu_yearly?: number | null
          lat?: number | null
          listing_type?: Database["public"]["Enums"]["listing_kind"]
          lng?: number | null
          near_lake?: boolean | null
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          parking_spaces?: number | null
          payment_amount_cents?: number
          payment_provider_ref?: string | null
          payment_status?: Database["public"]["Enums"]["property_payment_status"]
          pets_allowed?: boolean | null
          photos?: Json | null
          price?: number | null
          property_type?: Database["public"]["Enums"]["property_kind"]
          published_at?: string | null
          published_by_profile_id?: string | null
          realtor_id?: string | null
          reference_code?: string | null
          rejection_reason?: string | null
          rent_price?: number | null
          review_decided_at?: string | null
          review_decided_by_profile_id?: string | null
          review_status?: Database["public"]["Enums"]["property_review_status"]
          show_exact_location?: boolean | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          suites?: number | null
          title?: string
          tour_360_url?: string | null
          updated_at?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "realtor_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_published_by_profile_id_fkey"
            columns: ["published_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_review_decided_by_profile_id_fkey"
            columns: ["review_decided_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_favorites: {
        Row: {
          created_at: string | null
          profile_id: string
          property_id: string
        }
        Insert: {
          created_at?: string | null
          profile_id: string
          property_id: string
        }
        Update: {
          created_at?: string | null
          profile_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_inquiries: {
        Row: {
          contacted_at: string | null
          created_at: string | null
          id: string
          internal_notes: string | null
          message: string | null
          property_id: string
          requester_email: string | null
          requester_name: string
          requester_phone: string | null
          requester_profile_id: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string | null
          id?: string
          internal_notes?: string | null
          message?: string | null
          property_id: string
          requester_email?: string | null
          requester_name: string
          requester_phone?: string | null
          requester_profile_id?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          contacted_at?: string | null
          created_at?: string | null
          id?: string
          internal_notes?: string | null
          message?: string | null
          property_id?: string
          requester_email?: string | null
          requester_name?: string
          requester_phone?: string | null
          requester_profile_id?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_tenders: {
        Row: {
          city_id: string
          created_at: string | null
          deadline: string | null
          estimated_value: number | null
          id: string
          modality: string | null
          number: string | null
          raw_text: string | null
          source_url: string | null
          status: string | null
          summary_ai: string | null
          title: string
        }
        Insert: {
          city_id: string
          created_at?: string | null
          deadline?: string | null
          estimated_value?: number | null
          id?: string
          modality?: string | null
          number?: string | null
          raw_text?: string | null
          source_url?: string | null
          status?: string | null
          summary_ai?: string | null
          title: string
        }
        Update: {
          city_id?: string
          created_at?: string | null
          deadline?: string | null
          estimated_value?: number | null
          id?: string
          modality?: string | null
          number?: string | null
          raw_text?: string | null
          source_url?: string | null
          status?: string | null
          summary_ai?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_tenders_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_works: {
        Row: {
          city_id: string
          contractor: string | null
          cover_url: string | null
          created_at: string | null
          current_status: string | null
          description: string | null
          district_id: string | null
          expected_end: string | null
          id: string
          lat: number | null
          lng: number | null
          photos: Json | null
          progress_percent: number | null
          source_url: string | null
          start_date: string | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          city_id: string
          contractor?: string | null
          cover_url?: string | null
          created_at?: string | null
          current_status?: string | null
          description?: string | null
          district_id?: string | null
          expected_end?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          photos?: Json | null
          progress_percent?: number | null
          source_url?: string | null
          start_date?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          city_id?: string
          contractor?: string | null
          cover_url?: string | null
          created_at?: string | null
          current_status?: string | null
          description?: string | null
          district_id?: string | null
          expected_end?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          photos?: Json | null
          progress_percent?: number | null
          source_url?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_works_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_works_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      raffle_entries: {
        Row: {
          city_id: string
          created_at: string
          entries_count: number
          id: string
          points_spent: number
          profile_id: string
          raffle_id: string
        }
        Insert: {
          city_id: string
          created_at?: string
          entries_count?: number
          id?: string
          points_spent: number
          profile_id: string
          raffle_id: string
        }
        Update: {
          city_id?: string
          created_at?: string
          entries_count?: number
          id?: string
          points_spent?: number
          profile_id?: string
          raffle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raffle_entries_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_entries_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffles: {
        Row: {
          city_id: string
          cover_url: string | null
          created_at: string
          created_by_profile_id: string | null
          description: string | null
          draw_at: string
          drawn_at: string | null
          entry_cost_points: number
          id: string
          max_entries_per_profile: number
          prize_description: string
          prize_value_cents: number | null
          slug: string
          sponsor_business_id: string | null
          status: string
          title: string
          updated_at: string
          winner_profile_id: string | null
        }
        Insert: {
          city_id: string
          cover_url?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          description?: string | null
          draw_at: string
          drawn_at?: string | null
          entry_cost_points?: number
          id?: string
          max_entries_per_profile?: number
          prize_description: string
          prize_value_cents?: number | null
          slug: string
          sponsor_business_id?: string | null
          status?: string
          title: string
          updated_at?: string
          winner_profile_id?: string | null
        }
        Update: {
          city_id?: string
          cover_url?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          description?: string | null
          draw_at?: string
          drawn_at?: string | null
          entry_cost_points?: number
          id?: string
          max_entries_per_profile?: number
          prize_description?: string
          prize_value_cents?: number | null
          slug?: string
          sponsor_business_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          winner_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffles_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffles_sponsor_business_id_fkey"
            columns: ["sponsor_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffles_sponsor_business_id_fkey"
            columns: ["sponsor_business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffles_winner_profile_id_fkey"
            columns: ["winner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      realtor_agents: {
        Row: {
          active: boolean | null
          created_at: string | null
          creci: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          profile_id: string | null
          realtor_id: string
          role: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          creci?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          realtor_id: string
          role?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          creci?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          realtor_id?: string
          role?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realtor_agents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtor_agents_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["id"]
          },
        ]
      }
      realtors: {
        Row: {
          about: string | null
          address: string | null
          city_id: string
          cnpj: string | null
          cover_url: string | null
          created_at: string | null
          creci: string | null
          district_id: string | null
          email: string | null
          facebook: string | null
          featured: boolean | null
          hours: Json | null
          id: string
          instagram: string | null
          legal_name: string | null
          logo_url: string | null
          name: string
          owner_profile_id: string | null
          phone: string | null
          plan: string | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"] | null
          subscription_plan: Database["public"]["Enums"]["realtor_subscription_plan"]
          subscription_renews_at: string | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          city_id: string
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string | null
          creci?: string | null
          district_id?: string | null
          email?: string | null
          facebook?: string | null
          featured?: boolean | null
          hours?: Json | null
          id?: string
          instagram?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name: string
          owner_profile_id?: string | null
          phone?: string | null
          plan?: string | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          subscription_plan?: Database["public"]["Enums"]["realtor_subscription_plan"]
          subscription_renews_at?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
          city_id?: string
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string | null
          creci?: string | null
          district_id?: string | null
          email?: string | null
          facebook?: string | null
          featured?: boolean | null
          hours?: Json | null
          id?: string
          instagram?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          owner_profile_id?: string | null
          phone?: string | null
          plan?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          subscription_plan?: Database["public"]["Enums"]["realtor_subscription_plan"]
          subscription_renews_at?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realtors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtors_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtors_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          city_id: string
          code: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          city_id: string
          code: string
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          city_id?: string
          code?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_conversions: {
        Row: {
          city_id: string
          converted_at: string
          id: string
          referral_code: string
          referred_profile_id: string
          referrer_profile_id: string
        }
        Insert: {
          city_id: string
          converted_at?: string
          id?: string
          referral_code: string
          referred_profile_id: string
          referrer_profile_id: string
        }
        Update: {
          city_id?: string
          converted_at?: string
          id?: string
          referral_code?: string
          referred_profile_id?: string
          referrer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referred_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referrer_profile_id_fkey"
            columns: ["referrer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          attributes: Json
          city_id: string
          cover_url: string | null
          created_at: string | null
          cuisine: Json | null
          delivery: boolean | null
          description: string | null
          district_id: string | null
          featured: boolean | null
          featured_until: string | null
          hours: Json | null
          id: string
          ifood_url: string | null
          lat: number | null
          lng: number | null
          name: string
          og_image_url: string | null
          og_square_image_url: string | null
          owner_profile_id: string | null
          phone: string | null
          photos: Json | null
          price_range: string | null
          rating: number | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"] | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          attributes?: Json
          city_id: string
          cover_url?: string | null
          created_at?: string | null
          cuisine?: Json | null
          delivery?: boolean | null
          description?: string | null
          district_id?: string | null
          featured?: boolean | null
          featured_until?: string | null
          hours?: Json | null
          id?: string
          ifood_url?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          photos?: Json | null
          price_range?: string | null
          rating?: number | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          attributes?: Json
          city_id?: string
          cover_url?: string | null
          created_at?: string | null
          cuisine?: Json | null
          delivery?: boolean | null
          description?: string | null
          district_id?: string | null
          featured?: boolean | null
          featured_until?: string | null
          hours?: Json | null
          id?: string
          ifood_url?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          photos?: Json | null
          price_range?: string | null
          rating?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      road_route_snapshots: {
        Row: {
          city_id: string
          created_at: string
          der_alert_count: number
          der_status: string
          der_status_level: string
          destination_key: string
          destination_name: string
          distance_meters: number | null
          duration_seconds: number | null
          expires_at: string
          fetched_at: string
          id: string
          origin_label: string
          raw_der: Json
          raw_google: Json | null
          route_label: string
          source_summary: string
          static_duration_seconds: number | null
          traffic_status: string | null
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          der_alert_count?: number
          der_status: string
          der_status_level: string
          destination_key: string
          destination_name: string
          distance_meters?: number | null
          duration_seconds?: number | null
          expires_at: string
          fetched_at?: string
          id?: string
          origin_label?: string
          raw_der?: Json
          raw_google?: Json | null
          route_label: string
          source_summary: string
          static_duration_seconds?: number | null
          traffic_status?: string | null
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          der_alert_count?: number
          der_status?: string
          der_status_level?: string
          destination_key?: string
          destination_name?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          expires_at?: string
          fetched_at?: string
          id?: string
          origin_label?: string
          raw_der?: Json
          raw_google?: Json | null
          route_label?: string
          source_summary?: string
          static_duration_seconds?: number | null
          traffic_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "road_route_snapshots_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          city_id: string
          clicked_entity_id: string | null
          clicked_entity_type: string | null
          created_at: string
          id: string
          latency_ms: number | null
          profile_id: string | null
          query: string
          result_count: number
          session_hash: string | null
          updated_at: string
        }
        Insert: {
          city_id: string
          clicked_entity_id?: string | null
          clicked_entity_type?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          profile_id?: string | null
          query: string
          result_count: number
          session_hash?: string | null
          updated_at?: string
        }
        Update: {
          city_id?: string
          clicked_entity_id?: string | null
          clicked_entity_type?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          profile_id?: string | null
          query?: string
          result_count?: number
          session_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_queries_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_queries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_alerts: {
        Row: {
          active: boolean | null
          affected_area: string | null
          affected_district_ids: string[] | null
          city_id: string
          created_at: string | null
          description: string | null
          end_at: string | null
          id: string
          severity: string | null
          source: string | null
          source_url: string | null
          start_at: string | null
          title: string
          type: Database["public"]["Enums"]["alert_kind"]
        }
        Insert: {
          active?: boolean | null
          affected_area?: string | null
          affected_district_ids?: string[] | null
          city_id: string
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          severity?: string | null
          source?: string | null
          source_url?: string | null
          start_at?: string | null
          title: string
          type: Database["public"]["Enums"]["alert_kind"]
        }
        Update: {
          active?: boolean | null
          affected_area?: string | null
          affected_district_ids?: string[] | null
          city_id?: string
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          severity?: string | null
          source?: string | null
          source_url?: string | null
          start_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["alert_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "service_alerts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          active: boolean
          city_id: string
          content: string
          created_at: string
          description: string
          id: string
          keywords: Json
          module_key: string | null
          page_key: string
          subtitle: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          city_id: string
          content: string
          created_at?: string
          description: string
          id?: string
          keywords?: Json
          module_key?: string | null
          page_key: string
          subtitle?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          city_id?: string
          content?: string
          created_at?: string
          description?: string
          id?: string
          keywords?: Json
          module_key?: string | null
          page_key?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_pages_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_renders: {
        Row: {
          art_piece_id: string | null
          business_id: string
          city_id: string
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          status: string
          updated_at: string
          video_asset_id: string | null
          video_url: string | null
        }
        Insert: {
          art_piece_id?: string | null
          business_id: string
          city_id: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          status?: string
          updated_at?: string
          video_asset_id?: string | null
          video_url?: string | null
        }
        Update: {
          art_piece_id?: string | null
          business_id?: string
          city_id?: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          status?: string
          updated_at?: string
          video_asset_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_renders_art_piece_id_fkey"
            columns: ["art_piece_id"]
            isOneToOne: false
            referencedRelation: "art_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_renders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_renders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_renders_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_renders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_renders_video_asset_id_fkey"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_packages: {
        Row: {
          city_id: string
          contact_phone: string | null
          contact_whatsapp: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_hours: number | null
          featured: boolean | null
          gallery: Json | null
          id: string
          includes: Json | null
          itinerary: Json | null
          price: number | null
          provider_business_id: string | null
          slug: string
          status: Database["public"]["Enums"]["entity_status"] | null
          title: string
          total_distance_km: number | null
          total_duration_hours: number | null
          updated_at: string | null
        }
        Insert: {
          city_id: string
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          featured?: boolean | null
          gallery?: Json | null
          id?: string
          includes?: Json | null
          itinerary?: Json | null
          price?: number | null
          provider_business_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          title: string
          total_distance_km?: number | null
          total_duration_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          city_id?: string
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          featured?: boolean | null
          gallery?: Json | null
          id?: string
          includes?: Json | null
          itinerary?: Json | null
          price?: number | null
          provider_business_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"] | null
          title?: string
          total_distance_km?: number | null
          total_duration_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_packages_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_packages_provider_business_id_fkey"
            columns: ["provider_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_packages_provider_business_id_fkey"
            columns: ["provider_business_id"]
            isOneToOne: false
            referencedRelation: "mv_business_search"
            referencedColumns: ["id"]
          },
        ]
      }
      tourism_guides: {
        Row: {
          address: string | null
          aliases: string[]
          city_id: string
          content_blocks: Json
          cover_url: string | null
          created_at: string
          description: string | null
          faq: Json
          featured: boolean
          google_maps_url: string | null
          google_photos: Json
          google_place_id: string | null
          google_summary: string | null
          highlights: Json
          id: string
          instagram: string | null
          kind: Database["public"]["Enums"]["guide_kind"]
          lat: number | null
          lng: number | null
          name: string
          og_image_url: string | null
          og_square_image_url: string | null
          owner_profile_id: string | null
          phone: string | null
          photos: Json
          practical_info: Json
          rating: number | null
          reviews_count: number
          sections: Json
          seo: Json
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          tagline: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          aliases?: string[]
          city_id: string
          content_blocks?: Json
          cover_url?: string | null
          created_at?: string
          description?: string | null
          faq?: Json
          featured?: boolean
          google_maps_url?: string | null
          google_photos?: Json
          google_place_id?: string | null
          google_summary?: string | null
          highlights?: Json
          id?: string
          instagram?: string | null
          kind?: Database["public"]["Enums"]["guide_kind"]
          lat?: number | null
          lng?: number | null
          name: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          photos?: Json
          practical_info?: Json
          rating?: number | null
          reviews_count?: number
          sections?: Json
          seo?: Json
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          tagline?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          aliases?: string[]
          city_id?: string
          content_blocks?: Json
          cover_url?: string | null
          created_at?: string
          description?: string | null
          faq?: Json
          featured?: boolean
          google_maps_url?: string | null
          google_photos?: Json
          google_place_id?: string | null
          google_summary?: string | null
          highlights?: Json
          id?: string
          instagram?: string | null
          kind?: Database["public"]["Enums"]["guide_kind"]
          lat?: number | null
          lng?: number | null
          name?: string
          og_image_url?: string | null
          og_square_image_url?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          photos?: Json
          practical_info?: Json
          rating?: number | null
          reviews_count?: number
          sections?: Json
          seo?: Json
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          tagline?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tourism_guides_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourism_guides_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_channels: {
        Row: {
          city_id: string
          created_at: string | null
          daily_cap: number | null
          display_name: string
          display_number: string
          enabled: boolean
          id: string
          kind: Database["public"]["Enums"]["wa_channel_kind"]
          meta_secret_ref: string | null
          notes: string | null
          phone_number_id: string
          quality_checked_at: string | null
          quality_rating: string | null
          updated_at: string | null
          waba_id: string
          webhook_verify_token: string
        }
        Insert: {
          city_id: string
          created_at?: string | null
          daily_cap?: number | null
          display_name: string
          display_number: string
          enabled?: boolean
          id?: string
          kind: Database["public"]["Enums"]["wa_channel_kind"]
          meta_secret_ref?: string | null
          notes?: string | null
          phone_number_id: string
          quality_checked_at?: string | null
          quality_rating?: string | null
          updated_at?: string | null
          waba_id: string
          webhook_verify_token: string
        }
        Update: {
          city_id?: string
          created_at?: string | null
          daily_cap?: number | null
          display_name?: string
          display_number?: string
          enabled?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["wa_channel_kind"]
          meta_secret_ref?: string | null
          notes?: string | null
          phone_number_id?: string
          quality_checked_at?: string | null
          quality_rating?: string | null
          updated_at?: string | null
          waba_id?: string
          webhook_verify_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_channels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_inbound_queue: {
        Row: {
          attempts: number
          channel_id: string
          consumer: string
          created_at: string | null
          error: string | null
          id: string
          message_id: string
          picked_at: string | null
          processed_at: string | null
          status: Database["public"]["Enums"]["wa_queue_status"]
        }
        Insert: {
          attempts?: number
          channel_id: string
          consumer?: string
          created_at?: string | null
          error?: string | null
          id?: string
          message_id: string
          picked_at?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["wa_queue_status"]
        }
        Update: {
          attempts?: number
          channel_id?: string
          consumer?: string
          created_at?: string | null
          error?: string | null
          id?: string
          message_id?: string
          picked_at?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["wa_queue_status"]
        }
        Relationships: [
          {
            foreignKeyName: "wa_inbound_queue_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "wa_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_inbound_queue_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "wa_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_messages: {
        Row: {
          channel_id: string
          created_at: string | null
          delivered_at: string | null
          direction: Database["public"]["Enums"]["wa_direction"]
          error_code: string | null
          error_message: string | null
          from_number: string
          id: string
          kind: Database["public"]["Enums"]["wa_message_kind"]
          payload: Json
          profile_id: string | null
          read_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["wa_message_status"]
          template_language: string | null
          template_name: string | null
          template_variables: Json | null
          text_body: string | null
          to_number: string
          wamid: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["wa_direction"]
          error_code?: string | null
          error_message?: string | null
          from_number: string
          id?: string
          kind: Database["public"]["Enums"]["wa_message_kind"]
          payload: Json
          profile_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status: Database["public"]["Enums"]["wa_message_status"]
          template_language?: string | null
          template_name?: string | null
          template_variables?: Json | null
          text_body?: string | null
          to_number: string
          wamid?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["wa_direction"]
          error_code?: string | null
          error_message?: string | null
          from_number?: string
          id?: string
          kind?: Database["public"]["Enums"]["wa_message_kind"]
          payload?: Json
          profile_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["wa_message_status"]
          template_language?: string | null
          template_name?: string | null
          template_variables?: Json | null
          text_body?: string | null
          to_number?: string
          wamid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "wa_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_opt_ins: {
        Row: {
          channel_id: string
          created_at: string | null
          granted_at: string
          id: string
          kind: Database["public"]["Enums"]["wa_opt_in_kind"]
          phone_number: string
          profile_id: string
          revoked_at: string | null
          source: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          granted_at?: string
          id?: string
          kind: Database["public"]["Enums"]["wa_opt_in_kind"]
          phone_number: string
          profile_id: string
          revoked_at?: string | null
          source?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          granted_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["wa_opt_in_kind"]
          phone_number?: string
          profile_id?: string
          revoked_at?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_opt_ins_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "wa_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_opt_ins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_outbound_queue: {
        Row: {
          attempts: number
          channel_id: string
          created_at: string | null
          dedup_key: string | null
          error: string | null
          id: string
          interactive: Json | null
          kind: Database["public"]["Enums"]["wa_message_kind"]
          message_id: string | null
          picked_at: string | null
          processed_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["wa_queue_status"]
          template_language: string | null
          template_name: string | null
          template_variables: Json | null
          text_body: string | null
          to_number: string
        }
        Insert: {
          attempts?: number
          channel_id: string
          created_at?: string | null
          dedup_key?: string | null
          error?: string | null
          id?: string
          interactive?: Json | null
          kind?: Database["public"]["Enums"]["wa_message_kind"]
          message_id?: string | null
          picked_at?: string | null
          processed_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["wa_queue_status"]
          template_language?: string | null
          template_name?: string | null
          template_variables?: Json | null
          text_body?: string | null
          to_number: string
        }
        Update: {
          attempts?: number
          channel_id?: string
          created_at?: string | null
          dedup_key?: string | null
          error?: string | null
          id?: string
          interactive?: Json | null
          kind?: Database["public"]["Enums"]["wa_message_kind"]
          message_id?: string | null
          picked_at?: string | null
          processed_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["wa_queue_status"]
          template_language?: string | null
          template_name?: string | null
          template_variables?: Json | null
          text_body?: string | null
          to_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_outbound_queue_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "wa_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_outbound_queue_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "wa_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_sessions: {
        Row: {
          channel_id: string
          contact_number: string
          expires_at: string
          last_message_id: string | null
          opened_at: string
        }
        Insert: {
          channel_id: string
          contact_number: string
          expires_at?: string
          last_message_id?: string | null
          opened_at?: string
        }
        Update: {
          channel_id?: string
          contact_number?: string
          expires_at?: string
          last_message_id?: string | null
          opened_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_sessions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "wa_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_sessions_last_message_id_fkey"
            columns: ["last_message_id"]
            isOneToOne: false
            referencedRelation: "wa_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_templates: {
        Row: {
          category: Database["public"]["Enums"]["wa_template_category"]
          channel_id: string
          components: Json
          created_at: string | null
          id: string
          language: string
          last_synced_at: string | null
          local_hash: string
          meta_id: string | null
          name: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["wa_template_status"]
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["wa_template_category"]
          channel_id: string
          components: Json
          created_at?: string | null
          id?: string
          language?: string
          last_synced_at?: string | null
          local_hash: string
          meta_id?: string | null
          name: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["wa_template_status"]
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["wa_template_category"]
          channel_id?: string
          components?: Json
          created_at?: string | null
          id?: string
          language?: string
          last_synced_at?: string | null
          local_hash?: string
          meta_id?: string | null
          name?: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["wa_template_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_templates_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "wa_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_webhook_log: {
        Row: {
          error: string | null
          id: string
          payload: Json
          processed: boolean
          received_at: string | null
          signature_ok: boolean
        }
        Insert: {
          error?: string | null
          id?: string
          payload: Json
          processed?: boolean
          received_at?: string | null
          signature_ok: boolean
        }
        Update: {
          error?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          received_at?: string | null
          signature_ok?: boolean
        }
        Relationships: []
      }
      weather_snapshots: {
        Row: {
          apparent_temperature: number | null
          city_id: string
          created_at: string
          current_temperature: number | null
          daily: Json
          expires_at: string
          fetched_at: string
          id: string
          latitude: number
          longitude: number
          precipitation_probability: number | null
          provider: string
          raw: Json
          timezone: string
          updated_at: string
          weather_code: number | null
          wind_speed: number | null
        }
        Insert: {
          apparent_temperature?: number | null
          city_id: string
          created_at?: string
          current_temperature?: number | null
          daily?: Json
          expires_at: string
          fetched_at: string
          id?: string
          latitude: number
          longitude: number
          precipitation_probability?: number | null
          provider?: string
          raw?: Json
          timezone?: string
          updated_at?: string
          weather_code?: number | null
          wind_speed?: number | null
        }
        Update: {
          apparent_temperature?: number | null
          city_id?: string
          created_at?: string
          current_temperature?: number | null
          daily?: Json
          expires_at?: string
          fetched_at?: string
          id?: string
          latitude?: number
          longitude?: number
          precipitation_probability?: number | null
          provider?: string
          raw?: Json
          timezone?: string
          updated_at?: string
          weather_code?: number | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_snapshots_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      web_push_subscriptions: {
        Row: {
          auth: string
          city_id: string | null
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          profile_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          city_id?: string | null
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          profile_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          city_id?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          profile_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_push_subscriptions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_run_logs: {
        Row: {
          city_id: string | null
          city_slug: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          metadata: Json
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          city_slug?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          metadata?: Json
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          city_slug?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          metadata?: Json
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_run_logs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_business_search: {
        Row: {
          city_id: string | null
          city_slug: string | null
          district_name: string | null
          id: string | null
          name: string | null
          primary_category: string | null
          search_tsv: unknown
          short_description: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_fishing_search: {
        Row: {
          city_id: string | null
          description: string | null
          id: string | null
          kind: string | null
          name: string | null
          slug: string | null
          species: Json | null
          tsv: unknown
        }
        Relationships: []
      }
    }
    Functions: {
      aggregate_business_daily_stats: {
        Args: { p_date: string }
        Returns: undefined
      }
      apply_delivery_pro_payment: {
        Args: {
          p_business_id: string
          p_period_end?: string
          p_status: string
          p_subscription_id: string
        }
        Returns: undefined
      }
      approve_account_deletion: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: undefined
      }
      archive_expired_classifieds: { Args: never; Returns: number }
      archive_expired_properties: { Args: never; Returns: number }
      auto_resolve_old_pets: { Args: never; Returns: undefined }
      award_points: {
        Args: {
          p_city_id: string
          p_delta: number
          p_profile_id: string
          p_reason: string
          p_reference?: string
        }
        Returns: number
      }
      brl_text: { Args: { p_value: number }; Returns: string }
      cancel_account_deletion: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_audience: Database["public"]["Enums"]["notification_audience"]
          p_body: string
          p_city_id: string
          p_entity_id?: string
          p_entity_type?: string
          p_metadata?: Json
          p_priority: Database["public"]["Enums"]["notification_priority"]
          p_push_payload?: Json
          p_recipient_profile_id: string
          p_send_email?: boolean
          p_target_url: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      create_order: {
        Args: {
          p_business_id: string
          p_change_for?: number
          p_channel?: string
          p_customer_name?: string
          p_customer_phone?: string
          p_delivery_address?: Json
          p_delivery_notes?: string
          p_items: Json
          p_notes?: string
          p_order_type: string
          p_payment_method?: string
        }
        Returns: Json
      }
      current_pharmacy_on_duty: {
        Args: { p_city_id: string; p_date?: string }
        Returns: {
          active: boolean | null
          address: string | null
          city_id: string
          created_at: string | null
          google_maps_url: string | null
          id: string
          is_24h: boolean | null
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          whatsapp: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "pharmacies"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      delete_user_data: { Args: { p_profile_id: string }; Returns: undefined }
      delivery_is_pro: { Args: { p_business_id: string }; Returns: boolean }
      draw_raffle_winner: { Args: { p_raffle_id: string }; Returns: string }
      ensure_home_layout: { Args: { p_city_id: string }; Returns: string }
      entity_is_published: {
        Args: { p_city_id: string; p_entity_id: string; p_type: string }
        Returns: boolean
      }
      expire_classifieds: { Args: never; Returns: undefined }
      generate_referral_code: {
        Args: { p_city_id: string; p_profile_id: string }
        Returns: string
      }
      grant_citizen_role: { Args: { p_city_id: string }; Returns: undefined }
      has_push_target: { Args: { p_profile_id: string }; Returns: boolean }
      is_city_admin: { Args: { p_city_id: string }; Returns: boolean }
      is_merchant: { Args: { p_city_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      manages_attraction: {
        Args: { p_attraction_id: string }
        Returns: boolean
      }
      manages_business: { Args: { p_business_id: string }; Returns: boolean }
      manages_church: { Args: { p_church_id: string }; Returns: boolean }
      manages_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      manages_realtor: { Args: { p_realtor_id: string }; Returns: boolean }
      manages_tourism_entity: {
        Args: { p_city_id: string; p_id: string; p_table: string }
        Returns: boolean
      }
      match_embeddings: {
        Args: {
          p_city_id: string
          p_entity_types?: string[]
          p_limit?: number
          p_query_vector: string
        }
        Returns: {
          entity_id: string
          entity_type: string
          score: number
        }[]
      }
      monthly_business_metrics: {
        Args: { p_business_id: string; p_month: string }
        Returns: {
          map_clicks: number
          phone_clicks: number
          total_events: number
          views: number
          website_clicks: number
          whatsapp_clicks: number
        }[]
      }
      monthly_category_rank: {
        Args: { p_business_id: string; p_month: string }
        Returns: {
          category_size: number
          category_slug: string
          rank: number
        }[]
      }
      monthly_favorites_count: {
        Args: { p_business_id: string; p_month: string }
        Returns: number
      }
      next_order_code: { Args: { p_business_id: string }; Returns: number }
      notify_city_admins: {
        Args: {
          p_body: string
          p_city_id: string
          p_entity_id?: string
          p_entity_type?: string
          p_metadata?: Json
          p_priority: Database["public"]["Enums"]["notification_priority"]
          p_push_payload?: Json
          p_send_email?: boolean
          p_target_url: string
          p_title: string
          p_type: string
        }
        Returns: number
      }
      purge_old_business_events: { Args: never; Returns: number }
      push_enabled_for: {
        Args: { p_profile_id: string; p_type: string }
        Returns: boolean
      }
      reject_account_deletion: {
        Args: { p_notes: string; p_request_id: string }
        Returns: undefined
      }
      request_account_deletion: { Args: { p_reason: string }; Returns: string }
      set_business_online: {
        Args: {
          p_auto_offline?: string
          p_business_id: string
          p_online: boolean
          p_source?: string
        }
        Returns: undefined
      }
      slugify_ptbr: { Args: { input: string }; Returns: string }
      start_delivery_trial: { Args: { p_business_id: string }; Returns: string }
      update_order_status: {
        Args: {
          p_actor?: string
          p_note?: string
          p_order_id: string
          p_status: string
        }
        Returns: undefined
      }
      wa_session_open: {
        Args: { p_channel_id: string; p_contact: string }
        Returns: boolean
      }
      wa_touch_session: {
        Args: { p_channel_id: string; p_contact: string; p_message_id: string }
        Returns: undefined
      }
    }
    Enums: {
      accommodation_kind:
        | "pousada"
        | "hotel"
        | "chale"
        | "airbnb"
        | "camping"
        | "rancho"
        | "casa_temporada"
      account_deletion_status:
        | "pending"
        | "approved"
        | "rejected"
        | "completed"
        | "canceled"
      alert_kind:
        | "water"
        | "energy"
        | "traffic"
        | "weather"
        | "security"
        | "health"
      attraction_kind:
        | "balneario"
        | "mirante"
        | "cachoeira"
        | "trilha"
        | "igreja"
        | "museu"
        | "parque"
        | "praia"
        | "lago"
        | "historico"
      church_tradition: "catolica" | "evangelica" | "adventista" | "outra"
      city_status: "active" | "coming_soon" | "paused"
      classified_item_condition: "novo" | "seminovo" | "usado"
      classified_job_contract_kind: "clt" | "pj" | "temporario"
      classified_job_work_mode: "presencial" | "remoto" | "hibrido"
      classified_kind: "vehicle" | "job" | "service" | "item" | "other"
      classified_payment_status: "not_required" | "pending" | "paid" | "waived"
      classified_review_status:
        | "pending"
        | "approved"
        | "rejected"
        | "needs_changes"
      entity_status: "draft" | "pending" | "published" | "rejected" | "archived"
      feature_order_status:
        | "pending"
        | "paid"
        | "failed"
        | "expired"
        | "refunded"
      feature_order_target: "classified" | "community_group"
      garbage_kind:
        | "common"
        | "recyclable"
        | "organic"
        | "electronic"
        | "special"
      guide_kind: "distrito" | "cidade" | "tematico" | "roteiro"
      home_block_type:
        | "banner_carousel"
        | "category_grid"
        | "entity_list"
        | "promo_strip"
        | "business_promo_hero"
        | "features_grid"
        | "tile_strip"
        | "service_list"
        | "tourism_gateway"
        | "lodging_map"
        | "assistant_cta"
        | "transparency_pulse"
        | "cta_grid"
        | "newsletter_cta"
        | "weather"
        | "wide_banner"
        | "custom_hero_banner"
        | "featured_promo_grid"
        | "hero_composite"
        | "raw_html"
      listing_kind: "sale" | "rent" | "temporary"
      notification_audience: "user" | "city_admin" | "super_admin"
      notification_channel: "in_app" | "email" | "push"
      notification_delivery_status: "pending" | "sent" | "failed" | "skipped"
      notification_priority: "low" | "normal" | "high" | "urgent"
      order_kind: "delivery" | "pickup" | "table"
      order_payment_method: "pix" | "card_on_delivery" | "cash" | "whatsapp"
      order_payment_status: "pending" | "paid" | "refunded"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "dispatched"
        | "delivered"
        | "cancelled"
        | "rejected"
      portal_payment_provider: "asaas"
      portal_payment_source:
        | "business_subscription"
        | "feature_order"
        | "publication"
        | "manual"
        | "unknown"
      portal_payment_status:
        | "pending"
        | "paid"
        | "overdue"
        | "failed"
        | "cancelled"
        | "refunded"
      privacy_consent_event_type: "grant" | "revoke" | "update"
      privacy_consent_purpose:
        | "necessary"
        | "analytics"
        | "ads_measurement"
        | "marketing_email"
        | "push_notifications"
        | "ai_processing"
        | "public_listing"
      privacy_request_status:
        | "open"
        | "in_review"
        | "waiting_user"
        | "approved"
        | "rejected"
        | "completed"
        | "canceled"
      privacy_request_type:
        | "access"
        | "export"
        | "correction"
        | "deletion"
        | "anonymization"
        | "consent_revocation"
        | "objection"
        | "sharing_info"
        | "automated_decision_review"
      property_kind:
        | "apartment"
        | "house"
        | "cobertura"
        | "kitnet"
        | "studio"
        | "chacara"
        | "sitio"
        | "fazenda"
        | "terreno_urbano"
        | "terreno_rural"
        | "comercial_loja"
        | "comercial_sala"
        | "galpao"
        | "hotel"
      property_payment_status: "not_required" | "pending" | "paid" | "waived"
      property_review_status:
        | "pending"
        | "approved"
        | "rejected"
        | "needs_changes"
      realtor_subscription_plan: "free" | "pro" | "premium"
      role_kind:
        | "super_admin"
        | "city_admin"
        | "moderator"
        | "merchant"
        | "citizen"
      wa_channel_kind: "transactional" | "assistant"
      wa_direction: "in" | "out"
      wa_message_kind:
        | "text"
        | "template"
        | "interactive"
        | "media"
        | "location"
        | "contacts"
        | "reaction"
        | "system"
      wa_message_status:
        | "received"
        | "queued"
        | "sending"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
      wa_opt_in_kind: "transactional" | "marketing" | "assistant"
      wa_queue_status:
        | "pending"
        | "processing"
        | "done"
        | "failed"
        | "cancelled"
      wa_template_category: "UTILITY" | "AUTHENTICATION" | "MARKETING"
      wa_template_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "paused"
        | "disabled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      accommodation_kind: [
        "pousada",
        "hotel",
        "chale",
        "airbnb",
        "camping",
        "rancho",
        "casa_temporada",
      ],
      account_deletion_status: [
        "pending",
        "approved",
        "rejected",
        "completed",
        "canceled",
      ],
      alert_kind: [
        "water",
        "energy",
        "traffic",
        "weather",
        "security",
        "health",
      ],
      attraction_kind: [
        "balneario",
        "mirante",
        "cachoeira",
        "trilha",
        "igreja",
        "museu",
        "parque",
        "praia",
        "lago",
        "historico",
      ],
      church_tradition: ["catolica", "evangelica", "adventista", "outra"],
      city_status: ["active", "coming_soon", "paused"],
      classified_item_condition: ["novo", "seminovo", "usado"],
      classified_job_contract_kind: ["clt", "pj", "temporario"],
      classified_job_work_mode: ["presencial", "remoto", "hibrido"],
      classified_kind: ["vehicle", "job", "service", "item", "other"],
      classified_payment_status: ["not_required", "pending", "paid", "waived"],
      classified_review_status: [
        "pending",
        "approved",
        "rejected",
        "needs_changes",
      ],
      entity_status: ["draft", "pending", "published", "rejected", "archived"],
      feature_order_status: [
        "pending",
        "paid",
        "failed",
        "expired",
        "refunded",
      ],
      feature_order_target: ["classified", "community_group"],
      garbage_kind: [
        "common",
        "recyclable",
        "organic",
        "electronic",
        "special",
      ],
      guide_kind: ["distrito", "cidade", "tematico", "roteiro"],
      home_block_type: [
        "banner_carousel",
        "category_grid",
        "entity_list",
        "promo_strip",
        "business_promo_hero",
        "features_grid",
        "tile_strip",
        "service_list",
        "tourism_gateway",
        "lodging_map",
        "assistant_cta",
        "transparency_pulse",
        "cta_grid",
        "newsletter_cta",
        "weather",
        "wide_banner",
        "custom_hero_banner",
        "featured_promo_grid",
        "hero_composite",
        "raw_html",
      ],
      listing_kind: ["sale", "rent", "temporary"],
      notification_audience: ["user", "city_admin", "super_admin"],
      notification_channel: ["in_app", "email", "push"],
      notification_delivery_status: ["pending", "sent", "failed", "skipped"],
      notification_priority: ["low", "normal", "high", "urgent"],
      order_kind: ["delivery", "pickup", "table"],
      order_payment_method: ["pix", "card_on_delivery", "cash", "whatsapp"],
      order_payment_status: ["pending", "paid", "refunded"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "dispatched",
        "delivered",
        "cancelled",
        "rejected",
      ],
      portal_payment_provider: ["asaas"],
      portal_payment_source: [
        "business_subscription",
        "feature_order",
        "publication",
        "manual",
        "unknown",
      ],
      portal_payment_status: [
        "pending",
        "paid",
        "overdue",
        "failed",
        "cancelled",
        "refunded",
      ],
      privacy_consent_event_type: ["grant", "revoke", "update"],
      privacy_consent_purpose: [
        "necessary",
        "analytics",
        "ads_measurement",
        "marketing_email",
        "push_notifications",
        "ai_processing",
        "public_listing",
      ],
      privacy_request_status: [
        "open",
        "in_review",
        "waiting_user",
        "approved",
        "rejected",
        "completed",
        "canceled",
      ],
      privacy_request_type: [
        "access",
        "export",
        "correction",
        "deletion",
        "anonymization",
        "consent_revocation",
        "objection",
        "sharing_info",
        "automated_decision_review",
      ],
      property_kind: [
        "apartment",
        "house",
        "cobertura",
        "kitnet",
        "studio",
        "chacara",
        "sitio",
        "fazenda",
        "terreno_urbano",
        "terreno_rural",
        "comercial_loja",
        "comercial_sala",
        "galpao",
        "hotel",
      ],
      property_payment_status: ["not_required", "pending", "paid", "waived"],
      property_review_status: [
        "pending",
        "approved",
        "rejected",
        "needs_changes",
      ],
      realtor_subscription_plan: ["free", "pro", "premium"],
      role_kind: [
        "super_admin",
        "city_admin",
        "moderator",
        "merchant",
        "citizen",
      ],
      wa_channel_kind: ["transactional", "assistant"],
      wa_direction: ["in", "out"],
      wa_message_kind: [
        "text",
        "template",
        "interactive",
        "media",
        "location",
        "contacts",
        "reaction",
        "system",
      ],
      wa_message_status: [
        "received",
        "queued",
        "sending",
        "sent",
        "delivered",
        "read",
        "failed",
      ],
      wa_opt_in_kind: ["transactional", "marketing", "assistant"],
      wa_queue_status: ["pending", "processing", "done", "failed", "cancelled"],
      wa_template_category: ["UTILITY", "AUTHENTICATION", "MARKETING"],
      wa_template_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "paused",
        "disabled",
      ],
    },
  },
} as const
