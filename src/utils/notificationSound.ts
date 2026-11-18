export function playNotificationSound(sound: string, volume: number) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(volume, ctx.currentTime)

    if (sound === 'bell') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1)
      osc.connect(gain)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } else if (sound === 'chime') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } else if (sound === 'buzzer') {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = 220
      osc.connect(gain)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.6)
    } else {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 800
      osc.connect(gain)
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    }
  } catch {
    //
  }
}
