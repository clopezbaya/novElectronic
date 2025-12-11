import React from 'react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = '' }) => {
  const evaluateStrength = () => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^a-zA-Z0-9]/.test(password),
    };

    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.number) score++;
    if (checks.specialChar) score++;
    
    return { score, checks };
  };

  const { score, checks } = evaluateStrength();
  const strengthLabel = ['Muy Débil', 'Débil', 'Regular', 'Fuerte', 'Muy Fuerte', 'Excelente'];
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500'];

  const Checkmark = ({ valid }: { valid: boolean }) => (
    <span className={valid ? 'text-green-500' : 'text-gray-400'}>{valid ? '✓' : '✗'}</span>
  );

  return (
    <div className="w-full mt-2 max-w-xs mx-auto"> {/* Added max-w-xs and mx-auto */}
      {password.length > 0 && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className={`${strengthColor[score]} h-2.5 rounded-full transition-all duration-300`} 
                    style={{ width: `${(score / 5) * 100}%` }}
                ></div>
            </div>
            <p className="text-sm mt-1 text-left" style={{ color: strengthColor[score].replace('bg-', '').replace('-500', '') }}> {/* Added text-left */}
                Seguridad: {strengthLabel[score]}
            </p>
          </>
      )}
      <ul className="text-xs text-gray-500 mt-2 space-y-1 text-left"> {/* Added text-left */}
        <li><Checkmark valid={checks.length} /> Al menos 8 caracteres</li>
        <li><Checkmark valid={checks.lowercase} /> Una letra minúscula</li>
        <li><Checkmark valid={checks.uppercase} /> Una letra mayúscula</li>
        <li><Checkmark valid={checks.number} /> Un número</li>
        <li><Checkmark valid={checks.specialChar} /> Un caracter especial</li>
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
