import React from 'react';

const DndPokemonPage: React.FC = () => {
  return (
    <iframe
      src="/dnd_pokemon/index.html"
      title="D&D Pokémon"
      style={{ width: '100vw', height: '100vh', border: 'none', outline: 'none', background: '#1a1a2e', display: 'block' }}
      allowFullScreen
    />
  );
};

export default DndPokemonPage;
