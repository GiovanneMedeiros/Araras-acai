export const initialClients = [
  {
    id: 1,
    name: "Ana Souza",
    phone: "(11) 98765-4321",
    points: 8,
    totalSpent: 80,
    purchaseHistory: [
      {
        id: 101,
        date: "2026-03-30T15:22:00.000Z",
        value: 50,
        points: 5,
      },
      {
        id: 102,
        date: "2026-03-28T20:10:00.000Z",
        value: 30,
        points: 3,
      },
    ],
    redeemedRewards: [],
  },
  {
    id: 2,
    name: "Lucas Pereira",
    phone: "(11) 91234-5678",
    points: 5,
    totalSpent: 50,
    purchaseHistory: [
      {
        id: 201,
        date: "2026-03-29T18:45:00.000Z",
        value: 50,
        points: 5,
      },
    ],
    redeemedRewards: [
      {
        id: 202,
        date: "2026-03-20T19:00:00.000Z",
        cost: 10,
        label: "Açaí grátis",
      },
    ],
  },
  {
    id: 3,
    name: "Mariana Silva",
    phone: "(11) 96543-2100",
    points: 3,
    totalSpent: 30,
    purchaseHistory: [
      {
        id: 301,
        date: "2026-03-27T17:05:00.000Z",
        value: 30,
        points: 3,
      },
    ],
    redeemedRewards: [],
  },
]