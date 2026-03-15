type LifecycleEvent = {
  time: number;
  event: string;
  data?: any;
};

const lifecycleEvents: LifecycleEvent[] = [];

export function logLifecycle(event: string, data?: any) {

  lifecycleEvents.push({
    time: Date.now(),
    event,
    data
  });

  if (lifecycleEvents.length > 50) {
    lifecycleEvents.shift();
  }

}

export function getLifecycleEvents() {
  return lifecycleEvents;
}