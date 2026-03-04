export type CourseTee = {
  teeName: string;
  par: number;
  courseRating: number;
  slopeRating: number;
};

export type CourseStub = {
  id: string;
  name: string;
  city: string;
  state: string;
  tees: CourseTee[];
};

export const COURSE_STUBS: CourseStub[] = [
  {
    id: "turlock-gcc",
    name: "Turlock Golf & Country Club",
    city: "Turlock",
    state: "CA",
    tees: [
      {
        teeName: "Blue",
        par: 72,
        courseRating: 71.8,
        slopeRating: 129,
      },
      {
        teeName: "White",
        par: 72,
        courseRating: 69.5,
        slopeRating: 121,
      },
    ],
  },
  {
    id: "poppy-hills",
    name: "Poppy Hills Golf Course",
    city: "Pebble Beach",
    state: "CA",
    tees: [
      {
        teeName: "Championship",
        par: 71,
        courseRating: 73.4,
        slopeRating: 136,
      },
      {
        teeName: "Member",
        par: 71,
        courseRating: 70.8,
        slopeRating: 130,
      },
    ],
  },
  {
    id: "pasatiempo",
    name: "Pasatiempo Golf Club",
    city: "Santa Cruz",
    state: "CA",
    tees: [
      {
        teeName: "Back",
        par: 70,
        courseRating: 72.6,
        slopeRating: 134,
      },
      {
        teeName: "Regular",
        par: 70,
        courseRating: 70.2,
        slopeRating: 128,
      },
    ],
  },
];
