import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import { extensionRegistry } from "../extensions/registry";
import { supabase } from "../lib/supabase";

export const useExtensions = () => {
  const [loading, setLoading] = useState(true);
  const [availableExtensions, setAvailableExtensions] = useState<any[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());

  const getAnonymousId = () => {
    let id = localStorage.getItem("ascii-anonymous-id");
    if (!id) {
      id = Math.random().toString(36).substr(2, 9);
      localStorage.setItem("ascii-anonymous-id", id);
    }
    return id;
  };

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch all available extensions from DB
      const { data: allExtensions, error: extError } = await supabase
        .from("extensions")
        .select("*");

      if (extError) throw extError;
      setAvailableExtensions(allExtensions || []);

      // 2. Fetch installed extensions from LocalStorage
      const localInstalled = JSON.parse(localStorage.getItem("ascii-installed-extensions") || "[]");
      const installedSet = new Set<string>(localInstalled);
      setInstalledIds(installedSet);

      // 3. Register extensions that are "installed"
      if (allExtensions) {
        for (const extData of allExtensions) {
          const isInstalled = installedSet.has(extData.id);
          
          if (isInstalled) {
            try {
              const extLogic = new Function("LucideIcons", `return ${extData.code}`)(LucideIcons);
              
              if (typeof extLogic.icon === 'string' && (LucideIcons as any)[extLogic.icon]) {
                extLogic.icon = (LucideIcons as any)[extLogic.icon];
              } else if (!extLogic.icon) {
                extLogic.icon = LucideIcons.Puzzle;
              }

              extensionRegistry.register(extLogic);
              console.log(`[EXT] Registered installed extension: ${extLogic.type}`);
            } catch (err) {
              console.error(`[EXT] Failed to load extension ${extData.name}:`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error("[EXT] Error fetching extensions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const installExtension = async (extensionId: string) => {
    const localInstalled = JSON.parse(localStorage.getItem("ascii-installed-extensions") || "[]");
    if (!localInstalled.includes(extensionId)) {
      localInstalled.push(extensionId);
      localStorage.setItem("ascii-installed-extensions", JSON.stringify(localInstalled));
    }
    await fetchExtensions();
  };

  const autoInstallByTypes = async (types: string[]) => {
    const localInstalled = JSON.parse(localStorage.getItem("ascii-installed-extensions") || "[]");
    let changed = false;

    for (const type of types) {
      if (extensionRegistry.exists(type)) continue;

      const extData = availableExtensions.find(e => e.type === type);
      if (extData && !localInstalled.includes(extData.id)) {
        localInstalled.push(extData.id);
        changed = true;
        console.log(`[EXT] Auto-installing required extension: ${type}`);
      }
    }

    if (changed) {
      localStorage.setItem("ascii-installed-extensions", JSON.stringify(localInstalled));
      await fetchExtensions();
    }
  };

  const publishExtension = async (extension: {
    name: string;
    description: string;
    type: string;
    icon: string;
    code: string;
  }) => {
    const { error } = await supabase
      .from("extensions")
      .insert({
        ...extension,
        author_id: (await supabase.auth.getUser()).data.user?.id || null // Keep null if no auth
      });
    
    if (error) throw error;
    await fetchExtensions();
  };

  return { 
    loading, 
    extensions: availableExtensions, 
    installedIds,
    installExtension, 
    autoInstallByTypes,
    publishExtension, 
    refresh: fetchExtensions 
  };
};
