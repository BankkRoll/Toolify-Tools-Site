'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRandomGenerator } from '@/hooks/use-random-generator';
import { useAnimations } from '@/stores/settings-store';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';

/**
 * Interface for password strength analysis
 */
interface PasswordStrength {
  strength: number;
  level: string;
  color: string;
  feedback: string[];
}

/**
 * Password generator tool page
 */
export default function PasswordGeneratorPage() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState([12]);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });
  const [showPassword, setShowPassword] = useState(true);
  const [customSymbols, setCustomSymbols] = useState('!@#$%^&*');

  const { generateRandomPassword } = useRandomGenerator();
  const [history, setHistory] = useLocalStorage<string[]>('password-generator-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const optionsSectionRef = useRef(null);
  const outputSectionRef = useRef(null);
  const tipsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const optionsSectionInView = useInView(optionsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const tipsSectionInView = useInView(tipsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Generates a new password based on current options
   */
  const generatePassword = () => {
    if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
      return;
    }

    const newPassword = generateRandomPassword(length[0]);
    setPassword(newPassword);
    setHistory([`Password generated: ${length[0]} chars`, ...history].slice(0, 10));
  };

  /**
   * Calculates password strength and provides feedback
   */
  const calculateStrength = (pwd: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (pwd.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');

    if (pwd.length >= 12) score += 1;
    else if (pwd.length >= 8) feedback.push('Consider using 12+ characters');

    // Character type scoring
    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(pwd)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    else feedback.push('Include special characters');

    // Bonus points
    if (pwd.length >= 16) score += 1;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score += 1;

    const strength = Math.min(score * 12.5, 100);
    let level = 'Very Weak';
    let color = 'bg-red-500';

    if (strength >= 80) {
      level = 'Very Strong';
      color = 'bg-green-500';
    } else if (strength >= 60) {
      level = 'Strong';
      color = 'bg-blue-500';
    } else if (strength >= 40) {
      level = 'Moderate';
      color = 'bg-yellow-500';
    } else if (strength >= 20) {
      level = 'Weak';
      color = 'bg-orange-500';
    }

    return { strength, level, color, feedback };
  };

  /**
   * Clears the generated password
   */
  const clearPassword = () => {
    setPassword('');
  };

  const passwordStrength = password ? calculateStrength(password) : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';
  const MotionLi = animationsEnabled ? m.li : 'li';

  return (
    <ToolLayout toolId='general-password-generator'>
      <MotionDiv
        ref={containerRef}
        className='space-y-6'
        variants={animationsEnabled ? containerVariants : undefined}
        initial={animationsEnabled ? 'hidden' : undefined}
        animate={animationsEnabled ? (containerInView ? 'visible' : 'hidden') : undefined}
      >
        <MotionDiv
          ref={optionsSectionRef}
          className='grid grid-cols-1 lg:grid-cols-2 gap-6'
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (optionsSectionInView ? 'visible' : 'hidden') : undefined}
        >
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Password Options</CardTitle>
                <CardDescription>Customize your password requirements</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-3'>
                  <Label>Password Length: {length[0]}</Label>
                  <Slider
                    value={length}
                    onValueChange={setLength}
                    max={128}
                    min={4}
                    step={1}
                    className='w-full'
                  />
                  <div className='flex justify-between text-xs text-muted-foreground'>
                    <span>4</span>
                    <span>128</span>
                  </div>
                </div>

                <div className='space-y-4'>
                  <Label>Character Types</Label>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='uppercase'
                        checked={options.uppercase}
                        onCheckedChange={checked =>
                          setOptions(prev => ({
                            ...prev,
                            uppercase: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor='uppercase'>Uppercase Letters (A-Z)</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='lowercase'
                        checked={options.lowercase}
                        onCheckedChange={checked =>
                          setOptions(prev => ({
                            ...prev,
                            lowercase: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor='lowercase'>Lowercase Letters (a-z)</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='numbers'
                        checked={options.numbers}
                        onCheckedChange={checked =>
                          setOptions(prev => ({
                            ...prev,
                            numbers: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor='numbers'>Numbers (0-9)</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='symbols'
                        checked={options.symbols}
                        onCheckedChange={checked =>
                          setOptions(prev => ({
                            ...prev,
                            symbols: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor='symbols'>Symbols</Label>
                    </div>
                    {options.symbols && (
                      <MotionDiv
                        className='ml-6 space-y-2'
                        initial={animationsEnabled ? { opacity: 0, height: 0 } : undefined}
                        animate={animationsEnabled ? { opacity: 1, height: 'auto' } : undefined}
                        transition={animationsEnabled ? { duration: 0.3 } : undefined}
                      >
                        <Label htmlFor='customSymbols'>Custom Symbols</Label>
                        <Input
                          id='customSymbols'
                          value={customSymbols}
                          onChange={e => setCustomSymbols(e.target.value)}
                          placeholder='!@#$%^&*'
                          className='font-mono'
                        />
                      </MotionDiv>
                    )}
                  </div>
                </div>

                <div className='space-y-4'>
                  <Label>Advanced Options</Label>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='excludeSimilar'
                        checked={options.excludeSimilar}
                        onCheckedChange={checked =>
                          setOptions(prev => ({
                            ...prev,
                            excludeSimilar: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor='excludeSimilar'>
                        Exclude Similar Characters (i, l, 1, L, o, 0, O)
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='excludeAmbiguous'
                        checked={options.excludeAmbiguous}
                        onCheckedChange={checked =>
                          setOptions(prev => ({
                            ...prev,
                            excludeAmbiguous: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor='excludeAmbiguous'>
                        Exclude Ambiguous Characters ({`{ } [ ] ( ) / \\ ' " ~ , ; < > .`})
                      </Label>
                    </div>
                  </div>
                </div>

                <ActionButtons
                  onGenerate={generatePassword}
                  generateLabel='Generate Password'
                  onReset={clearPassword}
                  resetLabel='Clear'
                  variant='outline'
                  size='lg'
                />
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  Generated Password
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='icon'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MotionDiv
                  className='space-y-4'
                  initial={animationsEnabled ? { opacity: 0 } : undefined}
                  animate={animationsEnabled ? { opacity: 1 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  <div className='p-4 bg-muted rounded-lg min-h-[80px] flex items-center'>
                    <p
                      className={`font-mono text-lg break-all transition-all duration-300 ${
                        showPassword ? '' : 'filter blur-sm'
                      }`}
                    >
                      {password || "Click 'Generate Password' to create a password"}
                    </p>
                  </div>

                  {password && <ActionButtons copyText={password} variant='outline' size='sm' />}

                  {passwordStrength && (
                    <MotionDiv
                      className='space-y-3'
                      initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
                      animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
                      transition={animationsEnabled ? { delay: 0.2 } : undefined}
                    >
                      <div className='flex items-center justify-between'>
                        <Label className='flex items-center gap-2'>
                          <Shield className='h-4 w-4' />
                          Password Strength
                        </Label>
                        <Badge className={passwordStrength.color}>{passwordStrength.level}</Badge>
                      </div>
                      <Progress value={passwordStrength.strength} className='h-2' />
                      <p className='text-sm text-muted-foreground'>
                        Strength: {Math.round(passwordStrength.strength)}%
                      </p>
                    </MotionDiv>
                  )}
                </MotionDiv>
              </CardContent>
            </Card>
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          ref={outputSectionRef}
          className='grid grid-cols-1 lg:grid-cols-2 gap-6'
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (outputSectionInView ? 'visible' : 'hidden') : undefined}
        >
          {passwordStrength && passwordStrength.feedback.length > 0 && (
            <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
              <Card>
                <CardHeader>
                  <CardTitle>Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2'>
                    {passwordStrength.feedback.map((suggestion, index) => (
                      <MotionLi
                        key={index}
                        className='text-sm flex items-start gap-2'
                        initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                        animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                        transition={animationsEnabled ? { delay: index * 0.1 } : undefined}
                      >
                        <span className='text-muted-foreground'>•</span>
                        {suggestion}
                      </MotionLi>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </MotionDiv>
          )}

          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Security Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm'>
                  <MotionLi
                    className='flex items-start gap-2'
                    initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                    animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                    transition={animationsEnabled ? { delay: 0.1 } : undefined}
                  >
                    <span className='text-green-600'>✓</span>
                    Use a unique password for each account
                  </MotionLi>
                  <MotionLi
                    className='flex items-start gap-2'
                    initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                    animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                    transition={animationsEnabled ? { delay: 0.2 } : undefined}
                  >
                    <span className='text-green-600'>✓</span>
                    Store passwords in a password manager
                  </MotionLi>
                  <MotionLi
                    className='flex items-start gap-2'
                    initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                    animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                    transition={animationsEnabled ? { delay: 0.3 } : undefined}
                  >
                    <span className='text-green-600'>✓</span>
                    Enable two-factor authentication when available
                  </MotionLi>
                  <MotionLi
                    className='flex items-start gap-2'
                    initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                    animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                    transition={animationsEnabled ? { delay: 0.4 } : undefined}
                  >
                    <span className='text-green-600'>✓</span>
                    Regularly update important passwords
                  </MotionLi>
                  <MotionLi
                    className='flex items-start gap-2'
                    initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                    animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                    transition={animationsEnabled ? { delay: 0.5 } : undefined}
                  >
                    <span className='text-red-600'>✗</span>
                    Never share passwords or write them down
                  </MotionLi>
                </ul>
              </CardContent>
            </Card>
          </MotionDiv>
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
