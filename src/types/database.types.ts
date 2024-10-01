export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          location: string
          role: Database["public"]["Enums"]["account_role"]
          study_year: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          location: string
          role?: Database["public"]["Enums"]["account_role"]
          study_year: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          location?: string
          role?: Database["public"]["Enums"]["account_role"]
          study_year?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          activity: string | null
          ape_code: string | null
          city: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string
          siren: string | null
          siret: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          activity?: string | null
          ape_code?: string | null
          city: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code: string
          siren?: string | null
          siret?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          activity?: string | null
          ape_code?: string | null
          city?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string
          siren?: string | null
          siret?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      establishments: {
        Row: {
          activity: string | null
          address: string | null
          company_id: string
          created_at: string | null
          id: string
          name: string
          siret: string
          updated_at: string | null
        }
        Insert: {
          activity?: string | null
          address?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          name: string
          siret: string
          updated_at?: string | null
        }
        Update: {
          activity?: string | null
          address?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
          siret?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          id: string
          label: Database["public"]["Enums"]["feedback_label"]
          message: string
          status: Database["public"]["Enums"]["feedback_status"]
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: Database["public"]["Enums"]["feedback_label"]
          message: string
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: Database["public"]["Enums"]["feedback_label"]
          message?: string
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          payment_date: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          id?: string
          payment_date: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_date?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission_id: string
          role: Database["public"]["Enums"]["account_role"]
        }
        Insert: {
          created_at?: string | null
          permission_id: string
          role: Database["public"]["Enums"]["account_role"]
        }
        Update: {
          created_at?: string | null
          permission_id?: string
          role?: Database["public"]["Enums"]["account_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
        ]
      }
      user_company_interactions: {
        Row: {
          company_id: string
          contact_status: Database["public"]["Enums"]["contact_status"]
          created_at: string | null
          id: string
          is_liked: boolean
          linkedin_contact_name: string | null
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          contact_status?: Database["public"]["Enums"]["contact_status"]
          created_at?: string | null
          id?: string
          is_liked: boolean
          linkedin_contact_name?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          contact_status?: Database["public"]["Enums"]["contact_status"]
          created_at?: string | null
          id?: string
          is_liked?: boolean
          linkedin_contact_name?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_company_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_role: "User" | "Admin" | "Super Admin"
      contact_status:
        | "Not Contacted"
        | "Contacted"
        | "Replied"
        | "Interview Scheduled"
        | "Offer Received"
        | "Rejected"
      feedback_label:
        | "Issue"
        | "Idea"
        | "Question"
        | "Complaint"
        | "Feature Request"
        | "Other"
      feedback_status: "Open" | "In Progress" | "Closed"
      payment_status: "Pending" | "Completed" | "Failed" | "Refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
