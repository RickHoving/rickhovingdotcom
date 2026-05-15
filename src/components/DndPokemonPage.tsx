import React from 'react';

const DndPokemonPage: React.FC = () => {
  return (
    <iframe
      src="/dnd_pokemon/index.html"
      title="D&D Pokémon"
      style={{ width: '100%', height: '90vh', border: 'none', background: '#1a1a2e' }}
      allowFullScreen
    />
  );
};

export default DndPokemonPage;
