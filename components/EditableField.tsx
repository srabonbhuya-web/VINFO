import React from 'react';

interface EditableFieldProps {
  id: string;
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  iconClass: string;
  inputType?: string;
  placeholder?: string;
  readOnly?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  id,
  label,
  value,
  onChange,
  iconClass,
  inputType = 'text',
  placeholder,
  readOnly = false,
}) => {
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="absolute -top-2.5 left-2 inline-block bg-gray-900 px-1 text-[11px] font-semibold text-gray-400 z-10 flex items-center gap-1"
      >
        <span>{label}</span>
        {readOnly && (
          <span className="text-[9px] text-amber-400/90 font-medium flex items-center gap-0.5">
            <i className="fa-solid fa-lock text-[8px]"></i> (Locked)
          </span>
        )}
      </label>
      <div
        className={`flex items-center border rounded-xl px-3 py-2.5 transition-all ${
          readOnly
            ? 'border-gray-800 bg-gray-900/80 cursor-not-allowed select-none'
            : 'border-gray-700 bg-gray-850 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500'
        }`}
      >
        <i
          className={`${iconClass} ${
            readOnly ? 'text-indigo-400' : 'text-gray-400'
          } mr-2.5 w-4 text-center flex-shrink-0`}
        ></i>
        <input
          type={inputType}
          id={id}
          name={id}
          value={value}
          onChange={readOnly ? undefined : onChange}
          readOnly={readOnly}
          disabled={readOnly}
          placeholder={placeholder}
          className={`w-full bg-transparent p-0 border-none placeholder-gray-500 focus:ring-0 text-xs sm:text-sm ${
            readOnly
              ? 'text-gray-200 cursor-not-allowed font-medium'
              : 'text-gray-100'
          }`}
        />
        {readOnly && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-800/90 px-2 py-0.5 rounded-md border border-gray-700/60 flex-shrink-0 ml-1 shadow-sm">
            <i className="fa-solid fa-shield-halved text-indigo-400 text-[10px]"></i>
            <span className="text-[10px] font-semibold text-gray-300">Locked</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableField;