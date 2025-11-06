// utils/parentChildMapping.js
export const parentChildMapping = {
  kriti_thapa: {
    parentId: 1, // Must match actual user ID in Strapi
    children: [
      { id: 14, name: "Ram" } // Must match actual child ID in Strapi
    ]
  },
  joshna_subedi: {
    parentId: 2,
    children: [
      { id: 13, name: "Sita" }
    ]
  },
  pratistha_koirala: {
    parentId: 3,
    children: [
      { id: 15, name: "Gita" }
    ]
  }
};

// Helper function to get parent by child ID
export const getParentByChildId = (childId) => {
  for (const [username, parentData] of Object.entries(parentChildMapping)) {
    const child = parentData.children.find(c => c.id === parseInt(childId));
    if (child) {
      return {
        id: parentData.parentId,
        username: username,
        childName: child.name
      };
    }
  }
  return null;
};