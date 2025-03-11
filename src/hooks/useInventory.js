// hooks/useInventory.js
import { useContext, useMemo, useCallback } from 'react';
import { AppContext } from '../context/AppContext';

export const useInventory = () => {
  const {
    inventory,
    inventorySearchTerm,
    setInventorySearchTerm,
    handleAddIdol,
    handleRemoveIdol,
  } = useContext(AppContext);

  const filteredInventory = useMemo(() => {
    return inventory.filter((idol) => {
      if (!inventorySearchTerm) return true;

      const searchTerm = inventorySearchTerm.toLowerCase();

      if (
        idol.name.toLowerCase().includes(searchTerm) ||
        idol.type.toLowerCase().includes(searchTerm) ||
        (idol.isUnique && "unique".includes(searchTerm))
      ) {
        return true;
      }

      if (idol.prefixes && idol.prefixes.length > 0) {
        for (const prefix of idol.prefixes) {
          if (
            prefix.Name.toLowerCase().includes(searchTerm) ||
            prefix.Mod.toLowerCase().includes(searchTerm)
          ) {
            return true;
          }
        }
      }

      if (idol.suffixes && idol.suffixes.length > 0) {
        for (const suffix of idol.suffixes) {
          if (
            suffix.Name.toLowerCase().includes(searchTerm) ||
            suffix.Mod.toLowerCase().includes(searchTerm)
          ) {
            return true;
          }
        }
      }

      if (idol.isUnique && idol.uniqueModifiers && idol.uniqueModifiers.length > 0) {
        for (const mod of idol.uniqueModifiers) {
          if (mod.Mod.toLowerCase().includes(searchTerm)) {
            return true;
          }
        }
      }

      return false;
    });
  }, [inventory, inventorySearchTerm]);

  return {
    inventory,
    filteredInventory,
    inventorySearchTerm,
    setInventorySearchTerm,
    handleAddIdol,
    handleRemoveIdol,
  };
};