import React from 'react';

const ANIMALS = ['🐱', '🐶', '🦊', '🐰', '🐼', '🐨', '🐸', '🦉', '🐢', '🦖', '🐳', '🦅', '🦁', '🐻', '🐒'];

const Avatar = ({ anonId, gender }) => {
    // Hash anonId to a stable number between 1 and 100
    let hash = 0;
    if (anonId) {
        for (let i = 0; i < anonId.length; i++) {
            hash = anonId.charCodeAt(i) + ((hash << 5) - hash);
        }
    }
    const index = Math.abs(hash) % 100 + 1;
    const avatarUrl = `/avatars/avatar_${index}.svg`;
    const animalEmoji = ANIMALS[Math.abs(hash) % ANIMALS.length];

    const genderSymbol = gender === 'F' ? '♀' : gender === 'M' ? '♂' : null;
    const genderColor = gender === 'F' ? '#E040FB' : gender === 'M' ? '#2196F3' : null;

    return (
        <div className="relative flex-shrink-0 self-start">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-white flex items-center justify-center text-xl">
                {gender === 'NB' ? (
                    <span>{animalEmoji}</span>
                ) : (
                    <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentNode;
                            if (parent && !parent.querySelector('.avatar-fallback')) {
                                const span = document.createElement('span');
                                span.className = 'avatar-fallback';
                                span.style.fontSize = '1.25rem';
                                span.textContent = animalEmoji;
                                parent.appendChild(span);
                            }
                        }}
                    />
                )}
            </div>
            {genderSymbol && (
                <span
                    className="absolute bottom-0 right-0 text-[10px] font-bold leading-none w-4 h-4 flex items-center justify-center rounded-full bg-white"
                    style={{ color: genderColor, border: `1.5px solid ${genderColor}`, transform: 'translate(10%, 10%)' }}
                >
                    {genderSymbol}
                </span>
            )}
        </div>
    );
};

export default Avatar;
