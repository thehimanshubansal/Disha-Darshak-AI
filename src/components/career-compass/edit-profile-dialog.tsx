
'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function EditProfileDialog() {
  const { user, showEditProfile, setShowEditProfile, handleProfileUpdate } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
        setName(user.name);
        setAvatarPreview(user.avatar || null);
    }
  }, [user, showEditProfile]);


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const submitUpdate = async () => {
    setLoading(true);
    try {
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      await handleProfileUpdate({
          firstName,
          lastName,
          mobile,
          avatar: avatarPreview
      });
    } catch (error)      {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  if (!showEditProfile) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditProfile(false)} />
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative z-10 w-[90%] max-w-md rounded-xl border bg-background p-6 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
            <UserCog className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-headline font-semibold">Edit Profile</h2>
        </div>
        <div className="space-y-3">
            <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
                <AvatarImage src={avatarPreview || undefined} alt="Avatar Preview" />
                <AvatarFallback className='text-xs'>Photo</AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={() => photoRef.current?.click()} className="flex-1">
                <Upload className="h-4 w-4 mr-2" /> Upload Photo
            </Button>
            <input type="file" ref={photoRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
            </div>
            <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            <Button className="w-full" onClick={submitUpdate} disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
            </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
