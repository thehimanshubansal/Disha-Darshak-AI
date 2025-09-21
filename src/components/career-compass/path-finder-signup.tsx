'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { geminiExplainRoles } from '@/ai/flows/path-finder';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  mobile: string;
  age: string;
  country: string;
  gender: string;
  education: string;
  fieldOfInterest: string;
  answers?: Record<string, any>;
}

export function PathFinderSignup() {
  const { handleSignUp } = useAppContext();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    age: '',
    country: '',
    gender: '',
    education: '',
    fieldOfInterest: '',
  });
  const [loading, setLoading] = useState(false);
  const [suggestedFields, setSuggestedFields] = useState<string[]>([]);

  const updateForm = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAnswers = (qid: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      answers: { ...prev.answers, [qid]: value }
    }));
  };

  const validateStep1 = () => {
    const { firstName, lastName, email, password, confirmPassword, mobile, age, country, gender } = formData;
    if (!firstName || !lastName || !email || !password || !confirmPassword || !mobile || !age || !country || !gender) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return false;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return false;
    }
    if (isNaN(Number(age)) || Number(age) < 13 || Number(age) > 120) {
      toast({ title: 'Error', description: 'Please enter a valid age (13-120).', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const answers = formData.answers || {};
    if (!answers.q1 || !answers.q2 || !answers.q3 || !answers.q4?.length || !answers.q5 || !answers.q6) {
      toast({ title: 'Error', description: 'Please answer all questions.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const analyzeAnswers = async () => {
    setLoading(true);
    try {
      const suggestions = await geminiExplainRoles(formData.answers ?? {});
      setSuggestedFields(suggestions);
      setStep(3);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({ title: 'Error', description: 'Failed to analyze your responses. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await handleSignUp(formData);
      toast({ title: 'Success', description: 'Account created successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create account. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) analyzeAnswers();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Path Finder Signup</CardTitle>
        <CardDescription>Let's get you started on your career journey.</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => updateForm('firstName', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => updateForm('lastName', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => updateForm('email', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={(e) => updateForm('password', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" type="tel" value={formData.mobile} onChange={(e) => updateForm('mobile', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" min="13" max="120" value={formData.age} onChange={(e) => updateForm('age', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={formData.country} onChange={(e) => updateForm('country', e.target.value)} placeholder="e.g., United States" />
            </div>
            <div>
              <Label>Gender</Label>
              <RadioGroup onValueChange={(v) => updateForm('gender', v)}>
                <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="gender-male" /><Label htmlFor="gender-male">Male</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="gender-female" /><Label htmlFor="gender-female">Female</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="gender-other" /><Label htmlFor="gender-other">Other</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="prefer_not_to_say" id="gender-prefer-not" /><Label htmlFor="gender-prefer-not">Prefer not to say</Label></div>
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label>What's your highest level of education?</Label>
              <RadioGroup onValueChange={(v) => updateAnswers('q1', v)}>
                <div className="flex items-center space-x-2"><RadioGroupItem value="high_school" id="q1-1" /><Label htmlFor="q1-1">High School</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="bachelors" id="q1-2" /><Label htmlFor="q1-2">Bachelor's Degree</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="masters" id="q1-3" /><Label htmlFor="q1-3">Master's Degree</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="phd" id="q1-4" /><Label htmlFor="q1-4">PhD or higher</Label></div>
              </RadioGroup>
            </div>

            <div>
              <Label>What was/is your field of study?</Label>
              <Input onChange={(e) => updateAnswers('q2', e.target.value)} />
            </div>

            <div>
              <Label>What's your current situation?</Label>
              <RadioGroup onValueChange={(v) => updateAnswers('q3', v)}>
                <div className="flex items-center space-x-2"><RadioGroupItem value="student" id="q3-1" /><Label htmlFor="q3-1">Student</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="recent_grad" id="q3-2" /><Label htmlFor="q3-2">Recent Graduate</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="working" id="q3-3" /><Label htmlFor="q3-3">Working Professional</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="career_change" id="q3-4" /><Label htmlFor="q3-4">Looking for Career Change</Label></div>
              </RadioGroup>
            </div>

            <div>
              <Label>What are your top skills? (Select up to 3)</Label>
              <div className="space-y-2">
                {['Technical/Programming', 'Creative/Design', 'Analytical/Data', 'Communication', 'Leadership', 'Problem-Solving'].map(skill => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`q4-${skill}`} 
                      onCheckedChange={(checked) => {
                        const current = formData.answers?.q4 || [];
                        updateAnswers('q4', checked ? [...current, skill] : current.filter((s: string) => s !== skill));
                      }} 
                    />
                    <Label htmlFor={`q4-${skill}`}>{skill}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>What industries interest you?</Label>
              <Input onChange={(e) => updateAnswers('q5', e.target.value)} placeholder="e.g., Tech, Healthcare, Finance" />
            </div>

            <div>
              <Label>Describe your ideal job in one sentence.</Label>
              <Textarea onChange={(e) => updateAnswers('q6', e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Suggested Career Fields</h3>
            <ul className="space-y-2">
              {suggestedFields.map((field, i) => (
                <li key={i} className="flex items-center">
                  <ChevronRight className="mr-2 h-4 w-4" />
                  {field}
                </li>
              ))}
            </ul>
            <div>
              <Label htmlFor="fieldOfInterest">Select your preferred field</Label>
              <Select onValueChange={(v) => updateForm('fieldOfInterest', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  {suggestedFields.map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-4">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={nextStep} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !formData.fieldOfInterest}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Account
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}