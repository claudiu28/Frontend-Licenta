"use client"
import {AuthContextType} from "@/types/auth/AuthContextType";
import {createContext} from "react";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
