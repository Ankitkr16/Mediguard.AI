import React, { useState } from 'react';
import { useProfile, type FamilyProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { User, Plus, Trash2, Shield, Heart, ArrowRight } from 'lucide-react';

export const FamilyHub: React.FC = () => {
  const { profiles, currentProfile, createProfile, deleteProfile, selectProfile } = useProfile();
  const { largeText } = useTheme();

  // Form states
  const [relation, setRelation] = useState('Child');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fullName.trim()) {
      setError('Name is required');
      return;
    }
    const successResult = await createProfile(
      relation,
      fullName.trim(),
      age ? parseInt(age) : undefined,
      gender,
      weight ? parseFloat(weight) : undefined,
      height ? parseFloat(height) : undefined
    );
    if (successResult) {
      setSuccess('Profile added successfully!');
      setFullName('');
      setAge('');
      setWeight('');
      setHeight('');
    } else {
      setError('Failed to add profile.');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Title Header */}
      <div className="p-6 premium-card bg-white border border-[#f1f5f9] flex items-center justify-between">
        <div>
          <h2 className={`font-extrabold text-slate-800 leading-tight ${largeText ? 'text-2xl' : 'text-lg'}`}>
            Family Health Hub
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Manage and switch clinical profiles for your parents, children, and spouses.
          </p>
        </div>
        <Heart className="text-[#ff5224]" size={24} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: List of Profiles */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Active Profiles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profiles.map((prof) => {
              const isSelected = currentProfile?.id === prof.id;
              return (
                <div
                  key={prof.id}
                  onClick={() => selectProfile(prof.id)}
                  className={`p-5 rounded-[24px] cursor-pointer transition-all duration-300 border flex flex-col justify-between min-h-[160px] ${
                    isSelected
                      ? 'bg-gradient-to-tr from-[#ff5224]/5 to-[#ff7a59]/10 border-[#ff5224] shadow-md shadow-[#ff5224]/5'
                      : 'bg-white border-[#f1f5f9] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isSelected ? 'bg-[#ff5224] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <User size={18} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{prof.full_name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{prof.relation}</span>
                      </div>
                    </div>
                    {prof.relation !== 'Self' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete ${prof.full_name}'s profile?`)) {
                            deleteProfile(prof.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase border-t border-slate-100/50 pt-3 mt-3">
                    {prof.age && <span>Age: {prof.age}</span>}
                    {prof.gender && <span>Gender: {prof.gender}</span>}
                    {prof.weight && <span>Weight: {prof.weight} kg</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Add New Profile Form */}
        <div className="p-6 premium-card bg-white border border-[#f1f5f9] space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Create Family Member</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Add a new member to manage their medications.</p>
          </div>

          {error && <p className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{error}</p>}
          {success && <p className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Relation
              </label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-700 cursor-pointer"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Spouse">Spouse (Husband/Wife)</option>
                <option value="Child">Child (Son/Daughter)</option>
                <option value="Grandparent">Grandparent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Age (years)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-700 cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 65"
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 160"
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-2 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition flex justify-center items-center gap-1.5 shadow-sm"
            >
              <span>Add Member</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
