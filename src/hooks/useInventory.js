// hooks/useInventory.js
import { useContext, useMemo } from 'react';
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
    if (!inventorySearchTerm) return inventory;

    const searchTerm = inventorySearchTerm.toLowerCase();

    return inventory.filter((idol) => {
      // Check idol name and type
      if (
        idol.name.toLowerCase().includes(searchTerm) ||
        idol.type.toLowerCase().includes(searchTerm) ||
        (idol.isUnique && "unique".includes(searchTerm))
      ) {
        return true;
      }

      // Check prefixes
      if (idol.prefixes?.some(prefix =>
        prefix.Name.toLowerCase().includes(searchTerm) ||
        prefix.Mod.toLowerCase().includes(searchTerm)
      )) {
        return true;
      }

      // Check suffixes
      if (idol.suffixes?.some(suffix =>
        suffix.Name.toLowerCase().includes(searchTerm) ||
        suffix.Mod.toLowerCase().includes(searchTerm)
      )) {
        return true;
      }

      // Check unique modifiers
      if (
        idol.isUnique &&
        idol.uniqueModifiers?.some(mod => mod.Mod.toLowerCase().includes(searchTerm))
      ) {
        return true;
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