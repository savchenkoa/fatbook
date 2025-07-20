export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      collections: {
        Row: {
          id: number;
          name: string | null;
          userId: string | null;
        };
        Insert: {
          id?: number;
          name?: string | null;
          userId?: string | null;
        };
        Update: {
          id?: number;
          name?: string | null;
          userId?: string | null;
        };
        Relationships: [];
      };
      dishes: {
        Row: {
          calories: number | null;
          carbs: number | null;
          collectionId: number | null;
          cookedWeight: number | null;
          createdAt: string;
          defaultPortion: number | null;
          deleted: boolean | null;
          fats: number | null;
          hasIngredients: boolean;
          icon: string | null;
          id: number;
          name: string | null;
          proteins: number | null;
          searchable: unknown | null;
          updatedAt: string | null;
        };
        Insert: {
          calories?: number | null;
          carbs?: number | null;
          collectionId?: number | null;
          cookedWeight?: number | null;
          createdAt?: string;
          defaultPortion?: number | null;
          deleted?: boolean | null;
          fats?: number | null;
          hasIngredients?: boolean;
          icon?: string | null;
          id?: number;
          name?: string | null;
          proteins?: number | null;
          searchable?: unknown | null;
          updatedAt?: string | null;
        };
        Update: {
          calories?: number | null;
          carbs?: number | null;
          collectionId?: number | null;
          cookedWeight?: number | null;
          createdAt?: string;
          defaultPortion?: number | null;
          deleted?: boolean | null;
          fats?: number | null;
          hasIngredients?: boolean;
          icon?: string | null;
          id?: number;
          name?: string | null;
          proteins?: number | null;
          searchable?: unknown | null;
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dishes_collectionId_fkey";
            columns: ["collectionId"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      eatings: {
        Row: {
          calories: number;
          carbs: number;
          createdAt: string;
          day: string;
          dishId: number | null;
          fats: number;
          id: number;
          meal: Database["public"]["Enums"]["meal"];
          portion: number;
          proteins: number;
          userId: string;
        };
        Insert: {
          calories: number;
          carbs: number;
          createdAt?: string;
          day: string;
          dishId?: number | null;
          fats: number;
          id?: number;
          meal: Database["public"]["Enums"]["meal"];
          portion: number;
          proteins: number;
          userId: string;
        };
        Update: {
          calories?: number;
          carbs?: number;
          createdAt?: string;
          day?: string;
          dishId?: number | null;
          fats?: number;
          id?: number;
          meal?: Database["public"]["Enums"]["meal"];
          portion?: number;
          proteins?: number;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_eatings_dishId_fkey";
            columns: ["dishId"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredients: {
        Row: {
          calories: number;
          carbs: number;
          createdAt: string | null;
          dishId: number;
          fats: number;
          id: number;
          parentDishId: number;
          portion: number;
          proteins: number;
        };
        Insert: {
          calories: number;
          carbs: number;
          createdAt?: string | null;
          dishId: number;
          fats: number;
          id?: number;
          parentDishId: number;
          portion: number;
          proteins: number;
        };
        Update: {
          calories?: number;
          carbs?: number;
          createdAt?: string | null;
          dishId?: number;
          fats?: number;
          id?: number;
          parentDishId?: number;
          portion?: number;
          proteins?: number;
        };
        Relationships: [
          {
            foreignKeyName: "public_dishIngredients_dish_fkey";
            columns: ["dishId"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_dishIngredients_ingredient_fkey";
            columns: ["parentDishId"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          calories: number;
          carbs: number;
          fats: number;
          proteins: number;
          userId: string;
        };
        Insert: {
          calories: number;
          carbs: number;
          fats: number;
          proteins: number;
          userId: string;
        };
        Update: {
          calories?: number;
          carbs?: number;
          fats?: number;
          proteins?: number;
          userId?: string;
        };
        Relationships: [];
      };
      user_metadata: {
        Row: {
          collectionId: number | null;
          email: string | null;
          id: string;
        };
        Insert: {
          collectionId?: number | null;
          email?: string | null;
          id: string;
        };
        Update: {
          collectionId?: number | null;
          email?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_collectionId_fkey";
            columns: ["collectionId"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      eatings_by_day: {
        Row: {
          calories: number | null;
          carbs: number | null;
          day: string | null;
          fats: number | null;
          proteins: number | null;
          userId: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      search_dishes_pgroonga: {
        Args: {
          search_query: string;
          user_collection_id?: number;
          limit_count?: number;
        };
        Returns: {
          id: number;
          name: string;
          icon: string;
          proteins: number;
          fats: number;
          carbs: number;
          calories: number;
          defaultPortion: number;
          hasIngredients: boolean;
          cookedWeight: number;
          updatedAt: string;
          createdAt: string;
          collectionId: number;
        }[];
      };
    };
    Enums: {
      meal: "breakfast" | "lunch" | "dinner" | "snack";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      meal: ["breakfast", "lunch", "dinner", "snack"],
    },
  },
} as const;
