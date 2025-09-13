import React, {useEffect} from "react";

export const useInfiniteScroll = (
    ref: React.RefObject<Element | null> ,
    hasNextPage: boolean | undefined,
    isFetchingNextPage: boolean,
    fetchNextPage: () => Promise<unknown>
) => {
    useEffect(() => {
        if (!ref.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                fetchNextPage().then();
            }
        });

        observer.observe(ref.current);

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [ref, hasNextPage, isFetchingNextPage, fetchNextPage]);
};
