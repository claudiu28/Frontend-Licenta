"use client"

import {useState, useEffect, useRef} from "react"
import {Card} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Quote, BookOpen, Sparkles, Gift, Clock, Calendar, Share2, Heart, Loader2} from "lucide-react"
import {apiClient} from "@/api/client"
import {Page} from "@/types/page/page"
import {InfiniteData, useInfiniteQuery, useQuery} from "@tanstack/react-query"
import {ErrorResponse} from "@/types/ErrorType"
import {useCurrentUser} from "@/hooks/useCurrentUser"
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll"
import {Sidebar} from "@/components/Sidebar";

export type QuoteType = {
    quote: string
    author: string
}

export type Tips = {
    title: string
    description: string
}

export type DayData = {
    date: Date
    quote: QuoteType
    tip: Tips
    isAvailable: boolean
}

const getLatestQuoteCall = async () => {
    return apiClient<QuoteType>("utils/quote/latest", "GET")
}

const getLatestTipsCall = async () => {
    return apiClient<Tips>("utils/tips/latest", "GET")
}

const allTipsCall = async () => {
    return apiClient<Page<Tips>>(`utils/tips/all`, "GET")
}

const allQuotesCall = async () => {
    return apiClient<Page<QuoteType>>(`utils/quotes/all`, "GET")
}

const giftColors = [
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-green-400 to-green-600",
    "bg-gradient-to-br from-orange-400 to-orange-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
    "bg-gradient-to-br from-red-400 to-red-600"
]

export default function HomePage() {
    const {me: userMe} = useCurrentUser()

    const {
        data: allQuotesPaged,
        fetchNextPage: fetchNextQuotes,
        hasNextPage: hasNextQuotes,
        isFetchingNextPage: isFetchingNextQuotes,
        isLoading: isLoadingQuotes
    } = useInfiniteQuery<Page<QuoteType>, ErrorResponse, InfiniteData<Page<QuoteType>>, [string], number>({
        queryKey: ["all-quotes"],
        queryFn: ({pageParam}) => allQuotesCall(),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (!lastPage.last ? lastPage.number + 1 : undefined),
        enabled: !!userMe,
    })

    const {
        data: allTipsPaged,
        fetchNextPage: fetchNextTips,
        hasNextPage: hasNextTips,
        isFetchingNextPage: isFetchingNextTips,
        isLoading: isLoadingTips
    } = useInfiniteQuery<Page<Tips>, ErrorResponse, InfiniteData<Page<Tips>>, [string], number>({
        queryKey: ["all-tips"],
        queryFn: ({pageParam}) => allTipsCall(),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (!lastPage.last ? lastPage.number + 1 : undefined),
        enabled: !!userMe,
    })

    const quotesLoadMoreRef = useRef<HTMLDivElement | null>(null)
    const tipsLoadMoreRef = useRef<HTMLDivElement | null>(null)

    useInfiniteScroll(quotesLoadMoreRef, hasNextQuotes, isFetchingNextQuotes, fetchNextQuotes)
    useInfiniteScroll(tipsLoadMoreRef, hasNextTips, isFetchingNextTips, fetchNextTips)

    const allQuotes = allQuotesPaged ? allQuotesPaged.pages.flatMap((page) => page.content) : []
    const allTips = allTipsPaged ? allTipsPaged.pages.flatMap((page) => page.content) : []

    const {data: latestQuote, isLoading: isLoadingLatestQuote} = useQuery<QuoteType, ErrorResponse>({
        queryKey: ["latest-quote"],
        queryFn: () => getLatestQuoteCall(),
        enabled: !!userMe,
    })

    const {data: latestTip, isLoading: isLoadingLatestTip} = useQuery<Tips, ErrorResponse>({
        queryKey: ["latest-tip"],
        queryFn: () => getLatestTipsCall(),
        enabled: !!userMe,
    })


    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showQuoteModal, setShowQuoteModal] = useState(false)
    const [showAllQuotes, setShowAllQuotes] = useState(false)
    const [showAllTips, setShowAllTips] = useState(false)
    const [currentQuote, setCurrentQuote] = useState<QuoteType | null>(null)
    const [currentTip, setCurrentTip] = useState<Tips | null>(null)
    const [calendarData, setCalendarData] = useState<DayData[]>([])
    const [isLiked, setIsLiked] = useState(false)
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
    })

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(12, 0, 0, 0)

            const difference = tomorrow.getTime() - now.getTime()

            if (difference > 0) {
                setTimeLeft({
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                })
            }
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (allQuotes.length > 0 && allTips.length > 0 && calendarData.length === 0) {
            generateCalendarData()
        }
    }, [allQuotes.length, allTips.length])

    const generateCalendarData = () => {
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

        const data: DayData[] = []

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day)
            const isAvailable = date <= today

            const quote = allQuotes[(day - 1) % allQuotes.length] || {
                quote: "Click to reveal today's wisdom",
                author: "Daily Inspiration"
            }

            const tip = allTips[(day - 1) % allTips.length] || {
                title: "Daily Tip",
                description: "Click to discover today's tip"
            }

            data.push({
                date,
                quote: isAvailable ? quote : {quote: "Coming soon...", author: "Daily Inspiration"},
                tip: isAvailable ? tip : {title: "Coming soon", description: "Check back tomorrow!"},
                isAvailable
            })
        }

        setCalendarData(data)
    }

    const handleDateClick = (date: Date, quote: QuoteType, tip: Tips) => {
        if (!quote || !tip) return

        setSelectedDate(date)
        setCurrentQuote(quote)
        setCurrentTip(tip)
        setShowQuoteModal(true)
        setIsLiked(false)
    }

    const handleShare = async () => {
        if (!currentQuote || !currentTip) return

        const shareText = `"${currentQuote.quote}" - ${currentQuote.author}\n\nTip: ${currentTip.title}\n${currentTip.description}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Daily Inspiration",
                    text: shareText,
                })
            } catch (error) {
                console.log("Error sharing:", error)
                fallbackShare(shareText)
            }
        } else {
            fallbackShare(shareText)
        }
    }

    const fallbackShare = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
        }
    }

    const isLoading = isLoadingQuotes || isLoadingTips;
    return (
        <div className="flex min-h-screen bg-gradient-bg">
            <Sidebar/>
            <main className="flex-1 ml-64">
                <div className="p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
                            <p className="text-muted-foreground">Stay updated with your latest notifications and
                                messages</p>
                        </div>
                        <div
                            className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                            <header
                                className="relative overflow-hidden border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20"></div>
                                <div className="relative container mx-auto px-4 py-12">
                                    <div className="flex flex-col items-center gap-8">
                                        <div className="text-center space-y-4">
                                            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                                Daily <span className="text-amber-500">Inspiration</span>
                                            </h1>
                                            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                                                Discover a new AI-generated quote and tip every day at 12 PM. Click on
                                                any gift to reveal your daily dose of wisdom.
                                            </p>
                                        </div>

                                        <Card
                                            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl">
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-2 mb-6">
                                                    <Clock className="w-5 h-5 text-blue-500"/>
                                                    <span
                                                        className="text-sm font-medium text-slate-600 dark:text-slate-300">Next inspiration in</span>
                                                </div>

                                                <div className="flex items-center justify-center gap-6">
                                                    <div className="text-center">
                                                        <div
                                                            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {timeLeft.hours.toString().padStart(2, "0")}
                                                        </div>
                                                        <div
                                                            className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hours
                                                        </div>
                                                    </div>

                                                    <div className="text-3xl font-bold text-slate-400">:</div>

                                                    <div className="text-center">
                                                        <div
                                                            className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                                            {timeLeft.minutes.toString().padStart(2, "0")}
                                                        </div>
                                                        <div
                                                            className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minutes
                                                        </div>
                                                    </div>

                                                    <div className="text-3xl font-bold text-slate-400">:</div>

                                                    <div className="text-center">
                                                        <div
                                                            className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                                                            {timeLeft.seconds.toString().padStart(2, "0")}
                                                        </div>
                                                        <div
                                                            className="text-xs text-slate-500 dark:text-slate-400 mt-1">Seconds
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        <div className="flex gap-4 flex-wrap justify-center">
                                            <Button
                                                onClick={() => setShowAllQuotes(true)}
                                                disabled={!userMe || allQuotes.length === 0}
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                                            >
                                                <Quote className="w-5 h-5 mr-2"/>
                                                All Quotes ({allQuotes.length})
                                            </Button>
                                            <Button
                                                onClick={() => setShowAllTips(true)}
                                                disabled={!userMe || allTips.length === 0}
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                                            >
                                                <BookOpen className="w-5 h-5 mr-2"/>
                                                All Tips ({allTips.length})
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </header>

                            <main className="container mx-auto px-4 py-12">
                                <div className="max-w-6xl mx-auto">
                                    <div className="text-center mb-8">
                                        <div
                                            className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-full px-6 py-3 mb-4 shadow-lg">
                                            <Sparkles className="w-5 h-5 text-amber-500"/>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Click any gift to reveal today's wisdom</span>
                                        </div>
                                    </div>

                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-20">
                                            <div className="text-center">
                                                <Loader2 className="animate-spin w-12 h-12 text-blue-500 mx-auto mb-4"/>
                                                <p className="text-slate-600 dark:text-slate-300">Loading your daily
                                                    inspirations...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-4xl mx-auto">
                                            {/* Calendar Grid */}
                                            <div className="grid grid-cols-7 gap-4">
                                                {/* Day Headers */}
                                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                                    <div key={day}
                                                         className="text-center font-semibold text-slate-600 dark:text-slate-300 py-3">
                                                        {day}
                                                    </div>
                                                ))}

                                                {calendarData.map((dayData, index) => {
                                                    const colorClass = giftColors[index % giftColors.length]

                                                    return (
                                                        <Card
                                                            key={index}
                                                            className={`
                                                aspect-square p-4 cursor-pointer transition-all duration-300 
                                                ${dayData.isAvailable
                                                                ? "hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/20 bg-white/80 dark:bg-slate-800/80"
                                                                : "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                                                            }
                                                backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50
                                            `}
                                                            onClick={() => dayData.isAvailable && handleDateClick(dayData.date, dayData.quote, dayData.tip)}
                                                        >
                                                            <div
                                                                className="flex flex-col items-center justify-center h-full gap-2">
                                                                <div
                                                                    className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                                    {dayData.date.getDate()}
                                                                </div>

                                                                <div className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                                                    ${dayData.isAvailable ? colorClass + " animate-pulse" : "bg-slate-300 dark:bg-slate-600"}
                                                    transition-all duration-300
                                                `}>
                                                                    <Gift className="w-5 h-5 text-white"/>
                                                                </div>

                                                                {dayData.isAvailable && (
                                                                    <div
                                                                        className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium">
                                                                        Click to open
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </main>

                            <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
                                <DialogContent
                                    className="max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-2xl">
                                            <Quote className="w-6 h-6 text-blue-500"/>
                                            Daily Inspiration
                                        </DialogTitle>
                                    </DialogHeader>

                                    {currentQuote && currentTip && selectedDate && (
                                        <div className="space-y-8">
                                            <div
                                                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <Calendar className="w-4 h-4"/>
                                                {selectedDate.toLocaleDateString("en-US", {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </div>

                                            <div
                                                className="text-center py-6 border-b border-slate-200 dark:border-slate-700">
                                                <blockquote
                                                    className="text-2xl md:text-3xl font-medium leading-relaxed mb-6 text-slate-800 dark:text-slate-200">
                                                    "{currentQuote.quote}"
                                                </blockquote>
                                                <cite
                                                    className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    — {currentQuote.author}
                                                </cite>
                                            </div>

                                            <div
                                                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6">
                                                <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">
                                                    {currentTip.title}
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {currentTip.description}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-center gap-4 pt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsLiked(!isLiked)}
                                                    className={`transition-all duration-300 ${isLiked ? "text-red-500 border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
                                                >
                                                    <Heart
                                                        className={`w-4 h-4 mr-2 transition-all ${isLiked ? "fill-current scale-110" : ""}`}/>
                                                    {isLiked ? "Liked" : "Like"}
                                                </Button>

                                                <Button variant="outline" size="sm" onClick={handleShare}>
                                                    <Share2 className="w-4 h-4 mr-2"/>
                                                    Share
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>

                            <Dialog open={showAllQuotes} onOpenChange={setShowAllQuotes}>
                                <DialogContent
                                    className="max-w-4xl max-h-[80vh] overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-xl">
                                            <Quote className="w-6 h-6 text-blue-500"/>
                                            All Quotes ({allQuotes.length})
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="overflow-y-auto max-h-[60vh] space-y-4 mt-4">
                                        {allQuotes.map((quote, index) => (
                                            <Card key={index}
                                                  className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-700/50">
                                                <blockquote
                                                    className="text-lg font-medium mb-2 text-slate-800 dark:text-slate-200">
                                                    "{quote.quote}"
                                                </blockquote>
                                                <cite
                                                    className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    — {quote.author}
                                                </cite>
                                            </Card>
                                        ))}

                                        {hasNextQuotes && (
                                            <div ref={quotesLoadMoreRef} className="flex justify-center py-4">
                                                {isFetchingNextQuotes &&
                                                    <Loader2 className="animate-spin w-6 h-6 text-blue-500"/>}
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={showAllTips} onOpenChange={setShowAllTips}>
                                <DialogContent
                                    className="max-w-4xl max-h-[80vh] overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-xl">
                                            <BookOpen className="w-6 h-6 text-purple-500"/>
                                            All Tips ({allTips.length})
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="overflow-y-auto max-h-[60vh] space-y-4 mt-4">
                                        {allTips.map((tip, index) => (
                                            <Card key={index}
                                                  className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-slate-800/50 dark:to-slate-700/50">
                                                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">
                                                    {tip.title}
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-300">
                                                    {tip.description}
                                                </p>
                                            </Card>
                                        ))}

                                        {hasNextTips && (
                                            <div ref={tipsLoadMoreRef} className="flex justify-center py-4">
                                                {isFetchingNextTips &&
                                                    <Loader2 className="animate-spin w-6 h-6 text-purple-500"/>}
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}